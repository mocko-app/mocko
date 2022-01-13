import { RedisProvider } from "../../redis/redis.provider";
import {Service} from "../../utils/decorators/service";
import { FlagMemoryRepository } from "./flag.memory-repository";
import { FlagRedisRepository } from "./flag.redis-repository";
import { FlagRepository } from "./flag.repository";

@Service()
export class FlagService {
    private readonly repository: FlagRepository;

    constructor(
        private readonly redis: RedisProvider,
        private readonly memoryRepository: FlagMemoryRepository,
        private readonly redisRepository: FlagRedisRepository,
    ) {
        if(this.redis.isEnabled) {
            this.repository = this.redisRepository;
        } else {
            this.repository = this.memoryRepository;
        }
    }

    async setFlag(key: string, value: any, ttlMillis?: number): Promise<void> {
        await this.repository.set(key, value, ttlMillis);
    }

    async getFlag(key: string): Promise<any> {
        return await this.repository.get(key);
    }

    async delFlag(key: string): Promise<void> {
        await this.repository.del(key);
    }

    async hasFlag(key: string): Promise<boolean> {
        return await this.repository.has(key);
    }
}
