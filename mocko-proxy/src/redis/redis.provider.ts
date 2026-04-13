import {Provider} from "../utils/decorators/provider";
import {ConfigProvider} from "../config/config.service";
import * as Redis from 'ioredis';
import {IListener} from "../utils/listener";
import { inject } from "inversify";
import { ILogger, Logger } from "../utils/logger";
@Provider()
export class RedisProvider {
    private readonly connector: Redis.Redis;
    private readonly listener: Redis.Redis;

    private readonly REDIS_ENABLED: boolean;
    private readonly REDIS_PREFIX: string;

    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        private readonly config: ConfigProvider,
    ) {
        this.REDIS_ENABLED = config.getBoolean('REDIS_ENABLED');
        this.REDIS_PREFIX = config.getRedisPrefix();

        if(this.REDIS_ENABLED) {
            const redisUrl = this.config.getRedisUrl();
            if(redisUrl) {
                this.connector = new Redis(redisUrl, {
                    keyPrefix: this.REDIS_PREFIX,
                });
                this.listener = new Redis(redisUrl, {
                    keyPrefix: this.REDIS_PREFIX,
                });
                return;
            }

            const redisConfig = this.config.getRedisConfig();
            this.connector = new Redis(redisConfig);
            this.listener = new Redis(redisConfig);
        }
    }

    get isEnabled() {
        return this.REDIS_ENABLED;
    }

    async get<T>(key: string): Promise<T | null> {
        const str = await this.connector.get(key);
        if(str === null) {
            return null;
        }

        return JSON.parse(str) as T;
    }

    async del(key: string): Promise<void> {
        await this.connector.del(key);
    }

    async set<T>(key: string, value: T, ttlMillis?: number): Promise<void> {
        const str = JSON.stringify(value);

        if(ttlMillis) {
            await this.connector.set(key, str, 'PX', ttlMillis);
        } else {
            await this.connector.set(key, str);
        }
    }

    async publish(channel: string, message: string): Promise<void> {
        if(!this.isEnabled) {
            return;
        }

        await this.connector.publish(this.REDIS_PREFIX + channel, message);
    }

    async registerListener(listener: IListener): Promise<void> {
        if(!this.isEnabled) {
            return;
        }

        await this.listener.subscribe(this.REDIS_PREFIX + listener.channel);
        this.listener.on('message', (channel, message) => {
            if(channel !== this.REDIS_PREFIX + listener.channel) {
                return;
            }

            Promise.resolve(listener.onMessage(message))
                .catch(e => this.logger.error(`Listener '${listener.channel}' failed: ${e.message}`));
        });
    }

    async ping() {
        return await this.connector.ping();
    }
}
