import { PendingCallback } from "../callback.repository";

export class PendingCallbackDto {
    private constructor(
        public readonly id: string,
        public readonly slug: string,
        public readonly payload: unknown,
        public readonly dueAt: number,
        public readonly createdAt: number,
        public readonly triggeredByMockId: string | undefined,
    ) { }

    static ofPending(pending: PendingCallback): PendingCallbackDto {
        return new PendingCallbackDto(
            pending.id,
            pending.slug,
            pending.payload,
            pending.dueAt,
            pending.createdAt,
            pending.triggeredByMockId,
        );
    }
}
