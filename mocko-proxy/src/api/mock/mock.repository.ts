import {Provider} from "../../utils/decorators/provider";
import {RedisProvider} from "../../redis/redis.provider";
import { MockFailure } from "./data/mock-failure";

const MOCK_FAILURE_DURATION = 10 * 60 * 1000;

@Provider()
export class MockRepository {
    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async saveFailure(id: string, failure: MockFailure): Promise<void> {
        if(!this.redis.isEnabled) {
            return;
        }

        await this.redis.set(`mock_failure:${id}`, failure, MOCK_FAILURE_DURATION);
    }
}
