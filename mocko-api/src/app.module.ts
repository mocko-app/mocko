import {Module} from '@nestjs/common';
import {MockModule} from './mock/mock.module';
import {RedisModule} from './redis/redis.module';
import {configService} from "./config/config.service";
import {HealthModule} from './health/health.module';
import { FlagModule } from './flag/flag.module';

@Module({
    imports: [MockModule, RedisModule.forRoot(configService.getRedisConfig()), HealthModule, FlagModule],
    controllers: [],
    providers: [],
})
export class AppModule { }
