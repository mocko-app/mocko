import {Provider} from "../../utils/decorators/provider";
import * as fs from "fs";
import {MockOptions} from "./data/mock-options";
import {promisify} from "util";
import {RedisProvider} from "../../redis/redis.provider";
import {REDIS_OPTIONS_DEPLOYMENT} from "./mock.constants";

const readFile = promisify(fs.readFile);

@Provider()
export class MockRepository {
    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async getFileMockOptions(): Promise<MockOptions> {
        const buffer = await readFile('./mocks.json');
        return JSON.parse(buffer.toString()) as MockOptions;
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
}
