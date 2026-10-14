import { describe, expect, it } from "vitest";
import { sortPendingCallbacks } from "./pending-sort";
import { aPendingCallback } from "@/test/fixtures";

describe("sortPendingCallbacks", () => {
  it("lists held callbacks first, most recently held first, then scheduled ones by due time", () => {
    const later = aPendingCallback({ id: "later", dueAt: 3_000 });
    const sooner = aPendingCallback({ id: "sooner", dueAt: 1_000 });
    const heldEarlier = aPendingCallback({
      id: "held-earlier",
      dueAt: 500,
      heldAt: 100,
    });
    const heldRecently = aPendingCallback({
      id: "held-recently",
      dueAt: 9_000,
      heldAt: 200,
    });

    const sorted = sortPendingCallbacks([
      later,
      heldEarlier,
      sooner,
      heldRecently,
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "held-recently",
      "held-earlier",
      "sooner",
      "later",
    ]);
  });
});
