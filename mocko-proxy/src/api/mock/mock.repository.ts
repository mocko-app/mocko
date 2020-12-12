import { Duration } from "node-duration";
import {Provider} from "../../utils/decorators/provider";
import * as fs from "fs";
import {MockOptions, optionsFromConfig} from "./data/mock-options";
import {promisify} from "util";
import {RedisProvider} from "../../redis/redis.provider";
import {REDIS_OPTIONS_DEPLOYMENT} from "./mock.constants";
import {parse} from 'hcl-parser';
import { ignoreErrors } from "../../utils/utils";
import { MockFailure } from "./data/mock-failure";

const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);
const lstat = promisify(fs.lstat);

const MOCKS_DIR = "mocks";
const HCL_EXTENSION = ".hcl";
const MOCK_FAILURE_DURATION = Duration.ofMinutes(10);

export type FileOrDir = {
    name: string,
    isDir: boolean,
};

@Provider()
export class MockRepository {
    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async saveFailure(id: string, failure: MockFailure): Promise<void> {
        if(!this.redis.isEnabled()) {
            return;
        }

        await this.redis.set(`mock_failure:${id}`, failure, MOCK_FAILURE_DURATION);
    }

    async getFileMockOptions(): Promise<MockOptions> {
        const fileMocksBuffer = (await readFile('./mocks.hcl')
            .catch(ignoreErrors())) || "";
        const dirMocks = await this.getMockFilesContent();

        const data = parse(fileMocksBuffer.toString() + "\n" + dirMocks);
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
        if(this.redis.isEnabled()) {
            return await this.getRedisMockOptions();
        }

        return await this.getFileMockOptions();
    }

    private async getMockFilesContent(path = MOCKS_DIR): Promise<String> {
        const fileNames = await readDir(path)
            .catch(ignoreErrors());

        if(!fileNames) {
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
