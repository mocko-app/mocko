import { describe, expect, it } from "vitest";
import { formatFlagListCounts } from "./flag-list-counts";

describe("formatFlagListCounts", () => {
  it("shows the flag count when not searching", () => {
    expect(
      formatFlagListCounts(
        { isTruncated: false, count: 42, matchCount: 42 },
        false,
      ),
    ).toBe("42 flags");
    expect(
      formatFlagListCounts(
        { isTruncated: false, count: 1, matchCount: 1 },
        false,
      ),
    ).toBe("1 flag");
    expect(
      formatFlagListCounts(
        { isTruncated: false, count: 0, matchCount: 0 },
        false,
      ),
    ).toBe("0 flags");
  });

  it("marks the count as a lower bound when truncated", () => {
    expect(
      formatFlagListCounts(
        { isTruncated: true, count: 500, matchCount: 500 },
        false,
      ),
    ).toBe("500+ flags");
  });

  it("shows matches out of the total when searching", () => {
    expect(
      formatFlagListCounts(
        { isTruncated: false, count: 42, matchCount: 3 },
        true,
      ),
    ).toBe("3 of 42 flags");
    expect(
      formatFlagListCounts(
        { isTruncated: false, count: 1, matchCount: 1 },
        true,
      ),
    ).toBe("1 of 1 flag");
  });

  it("drops the unknown total when a search is truncated", () => {
    expect(
      formatFlagListCounts(
        { isTruncated: true, count: 500, matchCount: 3 },
        true,
      ),
    ).toBe("3+ matches");
    expect(
      formatFlagListCounts(
        { isTruncated: true, count: 500, matchCount: 1 },
        true,
      ),
    ).toBe("1+ match");
  });

  it("returns nothing when the backend does not report counts", () => {
    expect(formatFlagListCounts({ isTruncated: false }, false)).toBeUndefined();
    expect(
      formatFlagListCounts({ isTruncated: false, count: 5 }, true),
    ).toBeUndefined();
  });
});
