import {Provider} from "../../utils/decorators/provider";
import * as fs from "fs";
import {MockOptions, optionsFromConfig} from "./data/mock-options";
import {promisify} from "util";
import {RedisProvider} from "../../redis/redis.provider";
import {REDIS_OPTIONS_DEPLOYMENT} from "./mock.constants";
import {parse} from 'hcl-parser';

const readFile = promisify(fs.readFile);

@Provider()
export class MockRepository {
    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async getFileMockOptions(): Promise<MockOptions> {
        const buffer = await readFile('./mocks.hcl');
        const data = parse(buffer.toString());

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
}
