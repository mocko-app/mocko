import {DynamicModule, Global, Module, Provider} from '@nestjs/common';
import * as Redis from 'ioredis';
import {RedisOptions} from 'ioredis';
import {REDIS_CONNECTOR} from './redis.constants';
import {RedisProvider} from "./redis.provider";

@Global()
@Module({
    providers: [RedisProvider],
    exports: [RedisProvider],
})
export class RedisModule {
    static forRoot(config: RedisOptions): DynamicModule {
        const redisConnectorProvider: Provider<Promise<Redis.Redis>> = {
            provide: REDIS_CONNECTOR,
            useFactory: async () => {
                const connector = new Redis(config);
                await connector.connect();

                return connector;
            },
        };

        return {
            module: RedisModule,
            providers: [redisConnectorProvider, RedisProvider],
            exports: [redisConnectorProvider, RedisProvider],
        };
    }
}
