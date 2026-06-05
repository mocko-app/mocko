import {Service} from "../../utils/decorators/service";
import {RedisProvider} from "../../redis/redis.provider";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('../../../package.json') as { version: string };

@Service()
export class HealthService {
    private revision = 0;

    constructor(
        private readonly redisProvider: RedisProvider,
    ) { }

    async healthCheck() {
        if(this.redisProvider.isEnabled) {
            await this.redisProvider.ping();
        }
        return { revision: this.revision, version };
    }

    bumpRevision(): void {
        this.revision++;
    }
}
