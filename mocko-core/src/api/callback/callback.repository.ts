export type PendingCallback = {
    id: string,
    slug: string,
    payload: unknown,
    dueAt: number,
    createdAt: number,
    triggeredByMockId?: string,
    heldAt?: number,
};

export interface CallbackPendingRepository {
    schedule(pending: PendingCallback): Promise<void>;
    list(): Promise<PendingCallback[]>;
    find(id: string): Promise<PendingCallback | null>;
    claimDue(now: number): Promise<PendingCallback[]>;
    claim(id: string): Promise<PendingCallback | null>;
    hold(id: string, heldAt: number): Promise<PendingCallback | null>;
    cancel(id: string): Promise<boolean>;
    clear(): Promise<void>;
    nextDueAt(): Promise<number | null>;
}
