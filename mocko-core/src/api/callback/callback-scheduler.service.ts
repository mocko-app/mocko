import { inject } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import { Service } from "../../utils/decorators/service";
import { ILogger, Logger } from "../../utils/logger";
import { RedisProvider } from "../../redis/redis.provider";
import { CallbackDeliveryService } from "./callback-delivery.service";
import { CallbackMemoryRepository } from "./callback.memory-repository";
import { CallbackRedisRepository } from "./callback.redis-repository";
import { CallbackPendingRepository, PendingCallback } from "./callback.repository";

const debug = require('debug')('mocko:proxy:callback:scheduler');

const WAKE_CAP_MS = 10_000;

export type ScheduleRequest = {
    slug: string,
    payload: unknown,
    delay: number,
    triggeredByMockId?: string,
};

@Service()
export class CallbackSchedulerService {
    readonly repository: CallbackPendingRepository;
    private readonly usesSharedStore: boolean;
    private timer: NodeJS.Timeout | null = null;
    private timerAt: number | null = null;
    private started = false;

    constructor(
        @inject(Logger)
        private readonly logger: ILogger,
        redis: RedisProvider,
        memoryRepository: CallbackMemoryRepository,
        redisRepository: CallbackRedisRepository,
        private readonly delivery: CallbackDeliveryService,
    ) {
        this.usesSharedStore = redis.isEnabled;
        this.repository = this.usesSharedStore ? redisRepository : memoryRepository;
    }

    start(): void {
        if(this.started) {
            return;
        }

        this.started = true;
        debug(`scheduler started (${this.usesSharedStore ? 'redis' : 'memory'} store)`);
        void this.wake();
    }

    stop(): void {
        this.started = false;
        if(this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
            this.timerAt = null;
        }
        debug('scheduler stopped');
    }

    async schedule(request: ScheduleRequest): Promise<PendingCallback> {
        const now = Date.now();
        const pending: PendingCallback = {
            id: uuidv4(),
            slug: request.slug,
            payload: request.payload,
            dueAt: now + request.delay,
            createdAt: now,
            triggeredByMockId: request.triggeredByMockId,
        };

        await this.repository.schedule(pending);
        debug(`scheduled callback '${pending.slug}' (${pending.id}) due in ${request.delay}ms`);
        this.armTimer(pending.dueAt);
        return pending;
    }

    private async wake(): Promise<void> {
        this.timer = null;
        this.timerAt = null;
        debug('waking up');

        try {
            const due = await this.repository.claimDue(Date.now());
            debug(`claimed ${due.length} due callback(s)`);
            for(const pending of due) {
                void this.delivery.deliver(pending);
            }
        } catch(e) {
            const message = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Callback scheduler wake failed: ${message}`);
        }

        await this.armFromRepository();
    }

    private async armFromRepository(): Promise<void> {
        try {
            const nextDueAt = await this.repository.nextDueAt();

            if(nextDueAt !== null) {
                this.armTimer(nextDueAt);
            } else if(this.usesSharedStore) {
                debug('no pending callbacks, arming liveness wake');
                this.armTimer(Date.now() + WAKE_CAP_MS);
            } else {
                debug('no pending callbacks, going idle');
            }
        } catch(e) {
            const message = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Callback scheduler failed to peek next due time: ${message}`);
            this.armTimer(Date.now() + WAKE_CAP_MS);
        }
    }

    private armTimer(dueAt: number): void {
        if(!this.started) {
            return;
        }

        const cappedAt = Math.min(dueAt, Date.now() + WAKE_CAP_MS);
        if(this.timerAt !== null && this.timerAt <= cappedAt) {
            return;
        }

        if(this.timer) {
            clearTimeout(this.timer);
        }

        const delay = Math.max(cappedAt - Date.now(), 0);
        this.timerAt = cappedAt;
        this.timer = setTimeout(() => { void this.wake(); }, delay);
        this.timer.unref();
        debug(`timer armed to fire in ${delay}ms`);
    }
}
