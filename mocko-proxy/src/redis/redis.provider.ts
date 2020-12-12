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

    constructor(
        private readonly config: ConfigProvider,
    ) {
        if(config.getBoolean('REDIS_ENABLED')) {
            this.connector = new Redis(this.config.getRedisConfig());
            this.listener = new Redis(this.config.getRedisConfig());
        }
    }

    isEnabled() {
        return this.config.getBoolean('REDIS_ENABLED');
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
        if(!this.isEnabled()) {
            return;
        }

        await this.listener.subscribe(listener.channel);
        this.listener.on('message', (channel, message) => {
            if(channel !== listener.channel) {
                return;
            }

            listener.onMessage(message, server);
        });
    }

    async ping() {
        return await this.connector.ping();
    }
}
