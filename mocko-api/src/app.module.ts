import {Module} from '@nestjs/common';
import {MockModule} from './mock/mock.module';
import {RedisModule} from './redis/redis.module';
import {configService} from "./config/config.service";

@Module({
    imports: [MockModule, RedisModule.forRoot(configService.getRedisConfig())],
    controllers: [],
    providers: [],
})
export class AppModule { }
