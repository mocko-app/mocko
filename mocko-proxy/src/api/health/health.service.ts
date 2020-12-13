import {Service} from "../../utils/decorators/service";
import {RedisProvider} from "../../redis/redis.provider";

@Service()
export class HealthService {
    constructor(
        private readonly redisProvider: RedisProvider,
    ) { }

    async healthCheck() {
        if(this.redisProvider.isEnabled) {
            await this.redisProvider.ping();
        }
    }
}
