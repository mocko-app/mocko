import { RedisProvider } from "../../redis/redis.provider";
import { Service } from "../../utils/decorators/service";
import { CallbackPendingRepository, PendingCallback } from "./callback.repository";

const PENDING_KEY = 'callbacks:pending';
const HELD_KEY = 'callbacks:held';

const CLAIM_DUE_SCRIPT = `
    local members = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
    if #members > 0 then
        redis.call('ZREM', KEYS[1], unpack(members))
    end
    return members
`;

const HOLD_SCRIPT = `
    if redis.call('ZREM', KEYS[1], ARGV[1]) == 0 then
        return 0
    end
    redis.call('HSET', KEYS[2], ARGV[2], ARGV[3])
    return 1
`;

const CLAIM_HELD_SCRIPT = `
    local member = redis.call('HGET', KEYS[1], ARGV[1])
    if member then
        redis.call('HDEL', KEYS[1], ARGV[1])
    end
    return member
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
        const held = await this.redis.hgetall(HELD_KEY);
        return [
            ...entries.map(([member]) => this.deserialize(member)),
            ...Object.values(held).map((member) => this.deserialize(member)),
        ].sort((a, b) => a.dueAt - b.dueAt);
    }

    async find(id: string): Promise<PendingCallback | null> {
        const member = await this.findMember(id) ?? await this.redis.hget(HELD_KEY, id);
        return member === null ? null : this.deserialize(member);
    }

    async claimDue(now: number): Promise<PendingCallback[]> {
        const members = await this.redis.eval(CLAIM_DUE_SCRIPT, [PENDING_KEY], [now]) as string[];
        return members.map((member) => this.deserialize(member));
    }

    async claim(id: string): Promise<PendingCallback | null> {
        const member = await this.findMember(id);
        if(member !== null && await this.redis.zrem(PENDING_KEY, member) > 0) {
            return this.deserialize(member);
        }

        const held = await this.redis.eval(CLAIM_HELD_SCRIPT, [HELD_KEY], [id]) as string | null;
        return held === null ? null : this.deserialize(held);
    }

    async hold(id: string, heldAt: number): Promise<PendingCallback | null> {
        const member = await this.findMember(id);
        if(member === null) {
            return null;
        }

        const held: PendingCallback = { ...this.deserialize(member), heldAt };
        const moved = await this.redis.eval(
            HOLD_SCRIPT,
            [PENDING_KEY, HELD_KEY],
            [member, id, JSON.stringify(held)],
        );
        return moved === 1 ? held : null;
    }

    async cancel(id: string): Promise<boolean> {
        const member = await this.findMember(id);
        if(member !== null && await this.redis.zrem(PENDING_KEY, member) > 0) {
            return true;
        }

        return await this.redis.hdel(HELD_KEY, id) > 0;
    }

    async clear(): Promise<void> {
        await this.redis.del(PENDING_KEY, HELD_KEY);
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
