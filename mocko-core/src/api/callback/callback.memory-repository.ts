import { Service } from "../../utils/decorators/service";
import { CallbackPendingRepository, PendingCallback } from "./callback.repository";

@Service()
export class CallbackMemoryRepository implements CallbackPendingRepository {
    private pending = new Map<string, PendingCallback>();

    async schedule(pending: PendingCallback): Promise<void> {
        this.pending.set(pending.id, pending);
    }

    async list(): Promise<PendingCallback[]> {
        return [...this.pending.values()]
            .sort((a, b) => a.dueAt - b.dueAt);
    }

    async claimDue(now: number): Promise<PendingCallback[]> {
        const due = (await this.list())
            .filter((pending) => pending.dueAt <= now);
        due.forEach((pending) => this.pending.delete(pending.id));
        return due;
    }

    async claim(id: string): Promise<PendingCallback | null> {
        const pending = this.pending.get(id);
        if(!pending) {
            return null;
        }

        this.pending.delete(id);
        return pending;
    }

    async cancel(id: string): Promise<boolean> {
        return this.pending.delete(id);
    }

    async clear(): Promise<void> {
        this.pending.clear();
    }

    async nextDueAt(): Promise<number | null> {
        let next: number | null = null;
        for(const pending of this.pending.values()) {
            if(next === null || pending.dueAt < next) {
                next = pending.dueAt;
            }
        }

        return next;
    }
}
