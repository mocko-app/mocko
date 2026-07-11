import { inject } from "inversify";
import { Provider } from "../utils/decorators/provider";
import { definitionFromConfig, MockoDefinition, validateDefinition } from "./data/mocko-definition";
import { ILogger, Logger } from "../utils/logger";
import { RedisProvider } from "../redis/redis.provider";
import { REDIS_OPTIONS_DEPLOYMENT } from "./definition.constants";
import { promises } from "fs";
import { join, relative } from "path";
import {parse} from 'hcl-parser';
import * as Hoek from '@hapi/hoek';
import { Synchronize } from '@mocko/sync';
import { v5 as uuidv5 } from 'uuid';
import { Mock, MockSource } from "./data/mock";
import { Host } from "./data/host";
import { mergeData } from "../utils/utils";
import { DiagnosticsCollector } from "./diagnostics";

const debug = require('debug')('mocko:proxy:definition:provider');

const { readFile, readdir, lstat } = promises;

const MOCKS_DIR = process.env['MOCKS_FOLDER'] || "mocks";
const MUST_LOAD_DIR = !!process.env['MOCKS_FOLDER'];
const HCL_EXTENSION = ".hcl";
const DOT = ".";
const FILE_ID_NAMESPACE = '4e88cbd8-4eaf-48c1-a4e9-d958802337e3';

export type FileOrDir = {
    name: string,
    isDir: boolean,
};

@Provider()
export class DefinitionProvider {
    private definitions: MockoDefinition;
    private deployDefinition: MockoDefinition | null = null;

    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        private readonly redis: RedisProvider,
        private readonly diagnostics: DiagnosticsCollector,
    ) { }

    @Synchronize()
    async getDefinitions(): Promise<MockoDefinition> {
        if(!this.definitions) {
            this.definitions = await this.buildDefinitions();
        }

        return this.definitions;
    }

    async getFileHosts(): Promise<Host[]> {
        const fileDefinitions = await this.getFileDefinitions();
        return fileDefinitions.hosts;
    }

    clearDefinitions(): void {
        this.definitions = null;
    }

    setDeployDefinition(definition: MockoDefinition): void {
        this.deployDefinition = definition;
        this.clearDefinitions();
    }

    private async buildDefinitions(): Promise<MockoDefinition> {
        const fileDefinitions = await this.getFileDefinitions();
        const deployDefinitions = this.deployDefinition;

        if(this.redis.isEnabled) {
            const redisDefinitions = await this.getRedisDefinitions();
            return this.mergeDefinitions(fileDefinitions, redisDefinitions, deployDefinitions);
        }

        return this.mergeDefinitions(fileDefinitions, null, deployDefinitions);
    }

    private async getFileDefinitions(): Promise<MockoDefinition> {
        const options = (await this.getMockFilesContent()).filter(o => o !== null);
        return {
            mocks: options.map(o => o.mocks || []).flat(),
            data: mergeData(options.map(o => o.data || {})),
            hosts: options.map(o => o.hosts || []).flat(),
        };
    }

    private async getRedisDefinitions(): Promise<MockoDefinition> {
        debug('fetching mocks from redis');
        const definitions = await this.redis.get<Partial<MockoDefinition>>(REDIS_OPTIONS_DEPLOYMENT);

        if(!definitions) {
            debug('no mocks found, running proxy only');
            return { mocks: [], hosts: [] };
        }

        const normalizedDefinitions = validateDefinition({
            mocks: definitions.mocks || [],
            hosts: definitions.hosts || [],
            data: definitions.data,
        });

        debug(`found ${normalizedDefinitions.mocks.length} mocks`);
        return normalizedDefinitions;
    }

    private mergeDefinitions(
        fileDefinitions: MockoDefinition,
        redisDefinitions?: MockoDefinition | null,
        deployDefinitions?: MockoDefinition | null,
    ): MockoDefinition {
        const mocks = [
            ...this.withSource(deployDefinitions?.mocks || [], 'DEPLOYED'),
            ...this.withSource(redisDefinitions?.mocks || [], 'DEPLOYED'),
            ...this.withSource(fileDefinitions.mocks, 'FILE'),
        ];
        const hosts = [
            ...(deployDefinitions?.hosts || []),
            ...(redisDefinitions?.hosts || []),
            ...fileDefinitions.hosts,
        ];
        const data = mergeData([
            fileDefinitions.data || {},
            redisDefinitions?.data || {},
            deployDefinitions?.data || {},
        ]);

        return {
            mocks,
            hosts,
            data,
        };
    }

    private async getMockFilesContent(path = MOCKS_DIR): Promise<MockoDefinition[]> {
        if(!MUST_LOAD_DIR) {
            return [];
        }

        debug(`loading mocks from dir '${path}'`);
        const fileNames = await readdir(path)
            .catch(Hoek.ignore);

        if(!fileNames) {
            this.logger.error(`Failed to load the mocks from '${MOCKS_DIR}', make sure it's a directory and your user has read permission on its files`);
            process.exit(1);
        }

        const files: FileOrDir[] = await Promise.all(fileNames.map(async (name) => {
            const stat = await lstat(join(path, name));
            const isDir = stat.isDirectory();

            return { name, isDir };
        }));

        const mockFiles = files
            .filter(f => !f.isDir)
            .filter(f => !f.name.startsWith(DOT))
            .filter(f => f.name.endsWith(HCL_EXTENSION));

        const subDirContents = (await Promise.all(files
            .filter(f => f.isDir)
            .filter(f => !f.name.startsWith(DOT))
            .map(f => this.getMockFilesContent(join(path, f.name)))))
                .flat();
        
        const dirContents = await Promise.all(mockFiles
            .map(m => this.optionsFromFile(join(path, m.name))));

        return [...dirContents, ...subDirContents];
    }

    private async optionsFromFile(path: string): Promise<MockoDefinition | null> {
        const content = await readFile(path);
        const [data, error] = parse(content.toString());
        const file = this.normalizePath(path);

        if(error) {
            this.logger.warn(`Failed to parse file '${path}:${error.Pos.Line}:${error.Pos.Column}'`);
            this.diagnostics.push({
                code: 'hcl-parse-error',
                severity: 'error',
                file,
                message: `syntax error at line ${error.Pos.Line}, column ${error.Pos.Column}`,
            });
            return null;
        }

        const definition = definitionFromConfig(data, (e) => {
            this.logger.warn(`Invalid mock on file '${path}': ${e.message}`);
            this.diagnostics.push({
                code: 'invalid-mock',
                severity: 'error',
                file,
                message: e.message,
            });
        }, (e) => {
            this.logger.warn(`Invalid host on file '${path}': ${e.message}`);
            this.diagnostics.push({
                code: 'invalid-host',
                severity: 'error',
                file,
                message: e.message,
            });
        });
        definition.mocks = this.withFileMetadata(path, definition.mocks);
        return definition;
    }

    private normalizePath(filePath: string): string {
        return relative(MOCKS_DIR, filePath).replace(/\\/g, '/');
    }

    private withSource(mocks: Mock[], source: MockSource): Mock[] {
        return mocks.map((mock) => ({
            ...mock,
            source: mock.source || source,
        }));
    }

    private withFileMetadata(filePath: string, mocks: Mock[]): Mock[] {
        const normalizedFilePath = this.normalizePath(filePath);
        const seeds = mocks.map((mock) => this.fileIdSeed(normalizedFilePath, mock));
        const idSeeds = this.disambiguateSeeds(seeds);

        return mocks.map((mock, index) => ({
            ...mock,
            id: mock.id || uuidv5(idSeeds[index], FILE_ID_NAMESPACE),
            name: mock.name?.trim() || normalizedFilePath,
            filePath: normalizedFilePath,
            source: 'FILE',
        }));
    }

    private fileIdSeed(normalizedFilePath: string, mock: Mock): string {
        const base = `${normalizedFilePath}:${mock.method}:${mock.path}`;
        return mock.host ? `${base}:${mock.host}` : base;
    }

    private disambiguateSeeds(seeds: string[]): string[] {
        const counts = new Map<string, number>();
        for (const seed of seeds) {
            counts.set(seed, (counts.get(seed) || 0) + 1);
        }

        const occurrences = new Map<string, number>();
        return seeds.map((seed) => {
            const occurrence = occurrences.get(seed) || 0;
            occurrences.set(seed, occurrence + 1);
            return (counts.get(seed) || 0) > 1 ? `${seed}#${occurrence}` : seed;
        });
    }
}
