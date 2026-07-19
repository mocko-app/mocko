import { RedisProvider } from "../../redis/redis.provider";
import { Service } from "../../utils/decorators/service";
import { CallbackPendingRepository, PendingCallback } from "./callback.repository";

const PENDING_KEY = 'callbacks:pending';

const CLAIM_DUE_SCRIPT = `
    local members = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
    if #members > 0 then
        redis.call('ZREM', KEYS[1], unpack(members))
    end
    return members
`;

@Service()
export class CallbackRedisRepository implements CallbackPendingRepository {
    constructor(
        private readonly redis: RedisProvider,
    ) { }

    async schedule(pending: PendingCallback): Promise<void> {
        await this.redis.zadd(PENDING_KEY, pending.dueAt, JSON.stringify(pending));
    }

    async list(): Promise<PendingCallback[]> {
        const entries = await this.redis.zrangeWithScores(PENDING_KEY, 0, -1);
        return entries.map(([member]) => this.deserialize(member));
    }

    async claimDue(now: number): Promise<PendingCallback[]> {
        const members = await this.redis.eval(CLAIM_DUE_SCRIPT, [PENDING_KEY], [now]) as string[];
        return members.map((member) => this.deserialize(member));
    }

    async claim(id: string): Promise<PendingCallback | null> {
        const member = await this.findMember(id);
        if(member === null) {
            return null;
        }

        const removed = await this.redis.zrem(PENDING_KEY, member);
        if(removed === 0) {
            return null;
        }

        return this.deserialize(member);
    }

    async cancel(id: string): Promise<boolean> {
        const member = await this.findMember(id);
        if(member === null) {
            return false;
        }

        return await this.redis.zrem(PENDING_KEY, member) > 0;
    }

    async clear(): Promise<void> {
        await this.redis.del(PENDING_KEY);
    }

    async nextDueAt(): Promise<number | null> {
        const entries = await this.redis.zrangeWithScores(PENDING_KEY, 0, 0);
        if(entries.length === 0) {
            return null;
        }

        return entries[0][1];
    }

    private async findMember(id: string): Promise<string | null> {
        const entries = await this.redis.zrangeWithScores(PENDING_KEY, 0, -1);
        const entry = entries.find(([member]) => this.deserialize(member).id === id);
        return entry ? entry[0] : null;
    }

    private deserialize(member: string): PendingCallback {
        return JSON.parse(member) as PendingCallback;
    }
}
