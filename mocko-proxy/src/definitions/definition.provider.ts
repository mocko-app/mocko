import { inject } from "inversify";
import { Provider } from "../utils/decorators/provider";
import { definitionFromConfig, MockoDefinition } from "./data/mocko-definition";
import { ILogger, Logger } from "../utils/logger";
import { RedisProvider } from "../redis/redis.provider";
import { REDIS_OPTIONS_DEPLOYMENT } from "./definition.constants";
import { promises } from "fs";
import { join } from "path";
import {parse} from 'hcl-parser';
import * as Hoek from '@hapi/hoek';
import { Synchronize } from '@mocko/sync';

const debug = require('debug')('mocko:proxy:definition:provider');

const { readFile, readdir, lstat } = promises;

const MOCKS_DIR = process.env['MOCKS_FOLDER'] || "mocks";
const MUST_LOAD_DIR = !!process.env['MOCKS_FOLDER'];
const HCL_EXTENSION = ".hcl";

export type FileOrDir = {
    name: string,
    isDir: boolean,
};

@Provider()
export class DefinitionProvider {
    private definitions: MockoDefinition;

    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        private readonly redis: RedisProvider,
    ) { }

    @Synchronize()
    async getDefinitions(): Promise<MockoDefinition> {
        if(!this.definitions) {
            this.definitions = await this.buildDefinitions();
        }

        return this.definitions;
    }

    clearDefinitions(): void {
        this.definitions = null;
    }

    private async buildDefinitions(): Promise<MockoDefinition> {
        const fileMocks = await this.getFileDefinitions();

        if(this.redis.isEnabled) {
            const redisMocks = await this.getRedisDefinitions();

            return {
                mocks: [...redisMocks.mocks, ...fileMocks.mocks],
                data: fileMocks.data,
                hosts: fileMocks.hosts,
            };
        }

        return fileMocks;
    }

    private async getFileDefinitions(): Promise<MockoDefinition> {
        const options = (await this.getMockFilesContent()).filter(o => o !== null);
        return {
            mocks: options.map(o => o.mocks || []).flat(),
            data: options.map(o => o.data || {}).reduce((acc, value) => ({...acc, ...value}), {}),
            hosts: options.map(o => o.hosts || []).flat(),
        };
    }

    private async getRedisDefinitions(): Promise<MockoDefinition> {
        debug('fetching mocks from redis');
        const mocks = await this.redis.get<MockoDefinition>(REDIS_OPTIONS_DEPLOYMENT);

        if(!mocks) {
            debug('no mocks found, running proxy only');
            return { mocks: [], hosts: [] };
        }

        debug(`found ${mocks.mocks.length} mocks`);
        return mocks;
    }

    private async getMockFilesContent(path = MOCKS_DIR): Promise<MockoDefinition[]> {
        debug(`loading mocks from dir '${path}'`);
        const fileNames = await readdir(path)
            .catch(Hoek.ignore);

        if(!fileNames) {
            if(MUST_LOAD_DIR) {
                this.logger.error(`Failed to load the mocks from '${MOCKS_DIR}', make sure it's a directory and your user has read permission on its files`);
                process.exit(1);
            }
            return [];
        }

        const files: FileOrDir[] = await Promise.all(fileNames.map(async (name) => {
            const stat = await lstat(join(path, name));
            const isDir = stat.isDirectory();

            return { name, isDir };
        }));

        const mockFiles = files
            .filter(f => !f.isDir)
            .filter(f => f.name.endsWith(HCL_EXTENSION));

        const subDirContents = (await Promise.all(files
            .filter(f => f.isDir)
            .map(f => this.getMockFilesContent(join(path, f.name)))))
                .flat();
        
        const dirContents = await Promise.all(mockFiles
            .map(m => this.optionsFromFile(join(path, m.name))));

        return [...dirContents, ...subDirContents];
    }

    private async optionsFromFile(path: string): Promise<MockoDefinition | null> {
        const content = await readFile(path);
        const [data, error] = parse(content.toString());

        if(error) {
            this.logger.warn(`Failed to parse file '${path}:${error.Pos.Line}:${error.Pos.Column}'`);
            return null;
        }

        try {
            return definitionFromConfig(data);
        } catch(e) {
            this.logger.warn(`Invalid mock on file '${path}': ${e.message}`);
            return null;
        }
    }
}
