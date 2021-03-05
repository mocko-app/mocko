import {Injectable} from "@nestjs/common";
import {RedisProvider} from "../redis/redis.provider";
import {Mock} from "./data/mock.entity";
import {REDIS_MOCK_KEY, REDIS_OPTIONS_DEPLOYMENT} from "./mock.constants";
import {MockOptions} from "./data/mock-options.entity";
import { MockFailure } from "./data/mock-failure";

@Injectable()
export class MockRepository {
    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async save(mock: Mock) {
        await this.redis.hset(REDIS_MOCK_KEY, mock.id, mock);
    }

    async deleteMock(id: string) {
        await this.redis.hdel(REDIS_MOCK_KEY, id);
    }

    async deleteFailure(id: string) {
        await this.redis.del(`mock_failure:${id}`);
    }

    async listMocks(): Promise<Mock[]> {
        const mocks = await this.redis.getAll<Mock>(REDIS_MOCK_KEY);
        return Object.values(mocks);
    }

    async findById(id: string): Promise<Mock> {
        const mock = await this.redis.hget<Mock>(REDIS_MOCK_KEY, id);
        if(!mock) {
            return null;
        }

        mock.failure = await this.redis.get<MockFailure>(`mock_failure:${id}`);
        return mock;
    }

    async setOptions(options: MockOptions) {
        await this.redis.set(REDIS_OPTIONS_DEPLOYMENT, options);
    }
}
