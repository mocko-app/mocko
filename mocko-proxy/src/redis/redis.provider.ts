import { Duration } from "node-duration";
import {Provider} from "../utils/decorators/provider";
import {ConfigProvider} from "../config/config.service";
import * as Redis from 'ioredis';
import {IListener} from "../utils/listener";
import {Server} from "../server";
@Provider()
export class RedisProvider {
    private readonly connector: Redis.Redis;
    private readonly listener: Redis.Redis;

    private readonly REDIS_ENABLED: boolean;
    private readonly REDIS_PREFIX: string;

    constructor(
        private readonly config: ConfigProvider,
    ) {
        this.REDIS_ENABLED = config.getBoolean('REDIS_ENABLED');

        if(this.REDIS_ENABLED) {
            this.REDIS_PREFIX = config.get('REDIS_PREFIX');
            this.connector = new Redis(this.config.getRedisConfig());
            this.listener = new Redis(this.config.getRedisConfig());
        }
    }

    get isEnabled() {
        return this.REDIS_ENABLED;
    }

    async get<T>(key: string): Promise<T> {
        const str = await this.connector.get(key);
        return JSON.parse(str) as T;
    }

    async set<T>(key: string, value: T, ttl?: Duration): Promise<void> {
        const str = JSON.stringify(value);

        if(ttl) {
            await this.connector.set(key, str, 'PX', ttl.toMillis());
        } else {
            await this.connector.set(key, str);
        }
    }

    async registerListener(listener: IListener, server: Server): Promise<void> {
        if(!this.isEnabled) {
            return;
        }

        await this.listener.subscribe(this.REDIS_PREFIX + listener.channel);
        this.listener.on('message', (channel, message) => {
            if(channel !== this.REDIS_PREFIX + listener.channel) {
                return;
            }

            listener.onMessage(message, server);
        });
    }

    async ping() {
        return await this.connector.ping();
    }
}
