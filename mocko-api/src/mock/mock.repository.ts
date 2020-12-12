import {Injectable} from "@nestjs/common";
import {RedisProvider} from "../redis/redis.provider";
import {Mock} from "./data/mock.entity";
import {REDIS_MOCK_KEY, REDIS_OPTIONS_DEPLOYMENT} from "./mock.constants";
import {MockOptions} from "./data/mock-options.entity";

@Injectable()
export class MockRepository {
    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async createMock(mock: Mock) {
        await this.redis.hset(REDIS_MOCK_KEY, mock.id, mock);
    }

    async deleteMock(id: string) {
        await this.redis.hdel(REDIS_MOCK_KEY, id);
    }

    async listMocks(): Promise<Mock[]> {
        const mocks = await this.redis.getAll<Mock>(REDIS_MOCK_KEY);
        return Object.values(mocks);
    }

    async findById(id: string): Promise<Mock> {
        return await this.redis.hget<Mock>(REDIS_MOCK_KEY, id);
    }

    async setOptions(options: MockOptions) {
        await this.redis.set(REDIS_OPTIONS_DEPLOYMENT, options);
    }
}
