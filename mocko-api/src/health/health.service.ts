import {Injectable, ServiceUnavailableException} from '@nestjs/common';
import {RedisProvider} from "../redis/redis.provider";

@Injectable()
export class HealthService {
    constructor(
        private readonly redisProvider: RedisProvider,
    ) { }

    async healthCheck() {
        await this.redisProvider.ping();
    }
}
