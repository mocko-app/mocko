import {Service} from "../../utils/decorators/service";
import {RedisProvider} from "../../redis/redis.provider";

@Service()
export class HealthService {
    private revision = 0;

    constructor(
        private readonly redisProvider: RedisProvider,
    ) { }

    async healthCheck(): Promise<number> {
        if(this.redisProvider.isEnabled) {
            await this.redisProvider.ping();
        }
        return this.revision;
    }

    bumpRevision(): void {
        this.revision++;
    }
}
