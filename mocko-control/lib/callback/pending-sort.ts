import type { PendingCallbackDto } from "@/lib/types/callback-dtos";

export function sortPendingCallbacks(
  pending: PendingCallbackDto[],
): PendingCallbackDto[] {
  const held = pending
    .filter((item) => item.heldAt !== undefined)
    .sort((a, b) => (b.heldAt ?? 0) - (a.heldAt ?? 0));
  const scheduled = pending
    .filter((item) => item.heldAt === undefined)
    .sort((a, b) => a.dueAt - b.dueAt);

  return [...held, ...scheduled];
}
