import { Injectable, NotFoundException } from '@nestjs/common';
import { isRgbColor } from 'class-validator';
import { configService } from 'src/config/config.service';
import { RedisProvider } from 'src/redis/redis.provider';
import { FlagKeyDto, FlagKeyType } from './data/flag-key.dto';

const REDIS_PREFIX = configService.get('REDIS_PREFIX');

@Injectable()
export class FlagService {
    private readonly PREFIX = 'flags:';

    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async listFlags(flagPrefix: string): Promise<FlagKeyDto[]> {
        let prefix = REDIS_PREFIX + this.PREFIX + flagPrefix;
        if(!prefix.endsWith(':')) {
            prefix += ':';
        }

        const keys = (await this.redis.keys(prefix))
            .map(k => k.substring(prefix.length));

        const groups: Set<string> = new Set();
        const flags: string[] = [];

        for(const key of keys) {
            if(key.includes(':')) {
                groups.add(key.split(':')[0]);
            } else {
                flags.push(key);
            }
        }

        return [
            ...[...groups].map(g => new FlagKeyDto(FlagKeyType.PREFIX, g)),
            ...flags.map(f => new FlagKeyDto(FlagKeyType.FLAG, f)),
        ];
    }

    async getFlag(key: string): Promise<string> {
        const value = await this.redis.getRaw(this.PREFIX + key);

        if(value === null) {
            throw new NotFoundException('Flag not found');
        }

        return value;
    }
}
