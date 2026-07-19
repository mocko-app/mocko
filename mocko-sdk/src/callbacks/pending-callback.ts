/**
 * A scheduled callback delivery that has not fired yet.
 */
export type PendingCallback = {
  /** Unique id of this pending delivery. */
  id: string;
  /** Slug of the callback definition it will render at fire time. */
  slug: string;
  /** Payload the callback was triggered with. */
  payload: unknown;
  /** Epoch milliseconds at which the callback is due to fire. */
  dueAt: number;
  /** Epoch milliseconds at which the callback was scheduled. */
  createdAt: number;
  /** Id of the mock that triggered it, absent for manual and SDK fires. */
  triggeredByMockId?: string;
};
