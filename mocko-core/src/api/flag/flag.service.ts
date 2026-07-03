import { RedisProvider } from "../../redis/redis.provider";
import {Service} from "../../utils/decorators/service";
import { FlagMemoryRepository } from "./flag.memory-repository";
import { FlagRedisRepository } from "./flag.redis-repository";
import { Flag, FlagRepository, FlagSource } from "./flag.repository";
import { configProvider } from "../../config/config.service";
import { FlagKeyDto, FlagListDto } from "./data/flag.dto";

const FLAG_LIST_LIMIT = configProvider.getNumber('FLAGS_LIST-LIMIT');
type GroupCounts = {
    total: number;
    matches: number;
};

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

    async setFlag(key: string, value: any, source: FlagSource, ttlMillis?: number): Promise<Flag> {
        return await this.repository.set(key, value, source, ttlMillis);
    }

    async getFlag(key: string): Promise<any> {
        const flag = await this.repository.get(key);
        return flag?.value ?? null;
    }

    async getFlagDetails(key: string): Promise<Flag | null> {
        return await this.repository.get(key);
    }

    async delFlag(key: string): Promise<void> {
        await this.repository.del(key);
    }

    async hasFlag(key: string): Promise<boolean> {
        return await this.repository.has(key);
    }

    async listFlags(prefix: string, search?: string): Promise<FlagListDto> {
        const normalizedPrefix = this.normalizePrefix(prefix);
        const normalizedSearch = search?.toLowerCase();
        const keys = await this.repository.listFlags(normalizedPrefix);
        const counts = new Map<string, GroupCounts>();
        const groups: Set<string> = new Set();
        const flags: string[] = [];
        let isTruncated = false;

        for(const key of keys) {
            const relativeKey = normalizedPrefix.length > 0
                ? key.substring(normalizedPrefix.length)
                : key;

            if(!relativeKey) {
                continue;
            }

            const groupName = relativeKey.includes(':')
                ? relativeKey.split(':')[0]
                : relativeKey;
            const currentCounts = counts.get(groupName) ?? { total: 0, matches: 0 };
            currentCounts.total += 1;

            const matchesSearch =
                !normalizedSearch ||
                key.toLowerCase().includes(normalizedSearch);
            if(matchesSearch) {
                currentCounts.matches += 1;
            }
            counts.set(groupName, currentCounts);

            if(!matchesSearch) {
                continue;
            }

            if(relativeKey.includes(':')) {
                groups.add(groupName);
            } else {
                flags.push(relativeKey);
            }

            if(groups.size + flags.length >= FLAG_LIST_LIMIT) {
                isTruncated = true;
                break;
            }
        }

        const flagKeys = [
            ...Array.from(groups).map((name) =>
                FlagKeyDto.of(
                    'PREFIX',
                    name,
                    counts.get(name)?.total,
                    counts.get(name)?.matches,
                ),
            ),
            ...flags.map((name) => FlagKeyDto.of('FLAG', name)),
        ];

        let count = 0;
        let matchCount = 0;
        for(const groupCounts of counts.values()) {
            count += groupCounts.total;
            matchCount += groupCounts.matches;
        }

        return FlagListDto.of(flagKeys, isTruncated, count, matchCount);
    }

    private normalizePrefix(prefix: string): string {
        if(!prefix) {
            return '';
        }

        return prefix.endsWith(':') ? prefix : `${prefix}:`;
    }
}
