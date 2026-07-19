export type PendingCallback = {
    id: string,
    slug: string,
    payload: unknown,
    dueAt: number,
    createdAt: number,
    triggeredByMockId?: string,
};

export interface CallbackPendingRepository {
    schedule(pending: PendingCallback): Promise<void>;
    list(): Promise<PendingCallback[]>;
    claimDue(now: number): Promise<PendingCallback[]>;
    claim(id: string): Promise<PendingCallback | null>;
    cancel(id: string): Promise<boolean>;
    clear(): Promise<void>;
    nextDueAt(): Promise<number | null>;
}
