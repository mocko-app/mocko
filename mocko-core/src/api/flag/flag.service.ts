import { RedisProvider } from "../../redis/redis.provider";
import {Service} from "../../utils/decorators/service";
import { FlagMemoryRepository } from "./flag.memory-repository";
import { FlagRedisRepository } from "./flag.redis-repository";
import { FlagRepository } from "./flag.repository";
import { configProvider } from "../../config/config.service";
import { FlagKeyDto, FlagListDto } from "./data/flag.dto";

const FLAG_LIST_LIMIT = configProvider.getNumber('FLAGS_LIST-LIMIT');

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

    async listFlags(prefix: string): Promise<FlagListDto> {
        const normalizedPrefix = this.normalizePrefix(prefix);
        const keys = await this.repository.listFlags(normalizedPrefix);
        const groups: Set<string> = new Set();
        const flags: string[] = [];
        let isTruncated = false;

        for(const key of keys) {
            if(groups.size + flags.length >= FLAG_LIST_LIMIT) {
                isTruncated = true;
                break;
            }

            const relativeKey = normalizedPrefix.length > 0
                ? key.substring(normalizedPrefix.length)
                : key;

            if(!relativeKey) {
                continue;
            }

            if(relativeKey.includes(':')) {
                groups.add(relativeKey.split(':')[0]);
            } else {
                flags.push(relativeKey);
            }
        }

        const flagKeys = [
            ...Array.from(groups).map((name) => FlagKeyDto.of('PREFIX', name)),
            ...flags.map((name) => FlagKeyDto.of('FLAG', name)),
        ];

        return FlagListDto.of(flagKeys, isTruncated);
    }

    private normalizePrefix(prefix: string): string {
        if(!prefix) {
            return '';
        }

        return prefix.endsWith(':') ? prefix : `${prefix}:`;
    }
}
