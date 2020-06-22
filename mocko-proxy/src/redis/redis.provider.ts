import {Provider} from "../utils/decorators/provider";
import {ConfigProvider} from "../config/config.service";
import * as Redis from 'ioredis';

@Provider()
export class RedisProvider {
    private readonly connector: Redis.Redis;

    constructor(
        private readonly config: ConfigProvider,
    ) {
        if(config.getBoolean('REDIS_ENABLED')) {
            this.connector = new Redis(this.config.getRedisConfig());
        }
    }

    isEnabled() {
        return this.config.getBoolean('REDIS_ENABLED');
    }
}
