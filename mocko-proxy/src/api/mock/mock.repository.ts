import {Provider} from "../../utils/decorators/provider";
import * as fs from "fs";
import {MockOptions, optionsFromConfig} from "./data/mock-options";
import {promisify} from "util";
import {RedisProvider} from "../../redis/redis.provider";
import {REDIS_OPTIONS_DEPLOYMENT} from "./mock.constants";
import {parse} from 'hcl-parser';
import { ignoreErrors } from "../../utils/utils";
import { MockFailure } from "./data/mock-failure";
import { inject } from "inversify";
import { ILogger, Logger } from "../../utils/logger";

const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);
const lstat = promisify(fs.lstat);

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
        const dirMocks = await this.getMockFilesContent();
        const data = parse(dirMocks);
        return optionsFromConfig(data[0]);
    }

    async getRedisMockOptions(): Promise<MockOptions> {
        const mocks = await this.redis.get<MockOptions>(REDIS_OPTIONS_DEPLOYMENT);

        if(!mocks) {
            return { mocks: [] };
        }

        return mocks;
    }

    async getMockOptions(): Promise<MockOptions> {
        if(this.redis.isEnabled) {
            return await this.getRedisMockOptions();
        }

        return await this.getFileMockOptions();
    }

    private async getMockFilesContent(path = MOCKS_DIR): Promise<String> {
        const fileNames = await readDir(path)
            .catch(ignoreErrors());

        if(!fileNames) {
            if(MUST_LOAD_DIR) {
                this.logger.error(`Failed to load the mocks from '${MOCKS_DIR}', make sure it's a directory and your user has read permission on its files`);
                process.exit(1);
            }
            return "";
        }

        const files: FileOrDir[] = await Promise.all(fileNames.map(async (name) => {
            const stat = await lstat(`${path}/${name}`);
            const isDir = stat.isDirectory();

            return { name, isDir };
        }));

        const mocks = files
            .filter(f => !f.isDir)
            .filter(f => f.name.endsWith(HCL_EXTENSION));

        const subDirContents = await Promise.all(files
            .filter(f => f.isDir)
            .map(f => this.getMockFilesContent(`${path}/${f.name}`)));
        
        const dirContents = await Promise.all(mocks
            .map(m => readFile(`${path}/${m.name}`)));

        return dirContents.map(c => c.toString()).join("\n") + "\n" + subDirContents;
    }
}
