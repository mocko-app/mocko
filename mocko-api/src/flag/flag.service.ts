import { Injectable, NotFoundException } from '@nestjs/common';
import { configService } from '../config/config.service';
import { RedisProvider } from '../redis/redis.provider';
import { FlagKeyDto, FlagKeyType } from './data/flag-key.dto';
import { FlagListDto } from './data/flag-list.dto';

const REDIS_PREFIX = configService.get('REDIS_PREFIX');
const FLAGS_LIMIT = configService.getNumber('FLAGS_LIST-LIMIT');

@Injectable()
export class FlagService {
    private readonly PREFIX = 'flags:';

    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async listFlags(flagPrefix: string): Promise<FlagListDto> {
        let prefix = REDIS_PREFIX + this.PREFIX + flagPrefix;
        if(!prefix.endsWith(':')) {
            prefix += ':';
        }

        const keys = (await this.redis.keys(prefix))
            .map(k => k.substring(prefix.length));

        const groups: Set<string> = new Set();
        const flags: string[] = [];
        let isTruncated = false;

        for(const key of keys) {
            if(groups.size + flags.length >= FLAGS_LIMIT) {
                isTruncated = true;
                break;
            }

            if(key.includes(':')) {
                groups.add(key.split(':')[0]);
            } else {
                flags.push(key);
            }
        }

        const flagKeys = [
            ...[...groups].map(g => new FlagKeyDto(FlagKeyType.PREFIX, g)),
            ...flags.map(f => new FlagKeyDto(FlagKeyType.FLAG, f)),
        ];

        return new FlagListDto(flagKeys, isTruncated);
    }

    async getFlag(key: string): Promise<string> {
        const value = await this.redis.getRaw(this.PREFIX + key);

        if(value === null) {
            throw new NotFoundException('Flag not found');
        }

        return value;
    }
}
