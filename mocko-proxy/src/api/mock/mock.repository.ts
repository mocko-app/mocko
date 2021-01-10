import {Provider} from "../../utils/decorators/provider";
import { promises } from "fs";
import { join } from "path";
import {MockOptions, optionsFromConfig} from "./data/mock-options";
import {RedisProvider} from "../../redis/redis.provider";
import {REDIS_OPTIONS_DEPLOYMENT} from "./mock.constants";
import {parse} from 'hcl-parser';
import * as Hoek from '@hapi/hoek';
import { MockFailure } from "./data/mock-failure";
import { inject } from "inversify";
import { ILogger, Logger } from "../../utils/logger";

const debug = require('debug')('mocko:proxy:mock:repository');

const { readFile, readdir, lstat } = promises;

const MOCKS_DIR = process.env['MOCKS_FOLDER'] || "mocks";
const MUST_LOAD_DIR = !!process.env['MOCKS_FOLDER'];
const HCL_EXTENSION = ".hcl";
const MOCK_FAILURE_DURATION = 10 * 60 * 1000;

export type FileOrDir = {
    name: string,
    isDir: boolean,
};

@Provider()
export class MockRepository {
    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        private readonly redis: RedisProvider,
    ) { }

    async saveFailure(id: string, failure: MockFailure): Promise<void> {
        if(!this.redis.isEnabled) {
            return;
        }

        await this.redis.set(`mock_failure:${id}`, failure, MOCK_FAILURE_DURATION);
    }

    async getFileMockOptions(): Promise<MockOptions> {
        const options = (await this.getMockFilesContent()).filter(o => o !== null);
        return {
            mocks: options.map(o => o.mocks || []).flat(),
            data: options.map(o => o.data || {}).reduce((acc, value) => ({...acc, ...value}), {}),
        };
    }

    async getRedisMockOptions(): Promise<MockOptions> {
        debug('fetching mocks from redis');
        const mocks = await this.redis.get<MockOptions>(REDIS_OPTIONS_DEPLOYMENT);

        if(!mocks) {
            debug('no mocks found, running proxy only');
            return { mocks: [] };
        }

        debug(`found ${mocks.mocks.length} mocks`);
        return mocks;
    }

    async getMockOptions(): Promise<MockOptions> {
        if(this.redis.isEnabled) {
            return await this.getRedisMockOptions();
        }

        return await this.getFileMockOptions();
    }

    private async getMockFilesContent(path = MOCKS_DIR): Promise<MockOptions[]> {
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

    private async optionsFromFile(path: string): Promise<MockOptions | null> {
        const content = await readFile(path);
        const [data, error] = parse(content.toString());

        if(error) {
            this.logger.warn(`Failed to parse file '${path}:${error.Pos.Line}:${error.Pos.Column}'`);
            return null;
        }

        try {
            return optionsFromConfig(data);
        } catch(e) {
            this.logger.warn(`Invalid mock on file '${path}': ${e.message}`);
            return null;
        }
    }
}
