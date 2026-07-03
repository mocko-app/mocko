import { describe, expect, it } from "vitest";
import { formatMockListCounts } from "./mock-list-counts";

describe("formatMockListCounts", () => {
  it("shows the total with the disabled count", () => {
    expect(formatMockListCounts(5, 2)).toBe("5 mocks · 2 disabled");
    expect(formatMockListCounts(1, 1)).toBe("1 mock · 1 disabled");
  });

  it("collapses to the total when no mock is disabled", () => {
    expect(formatMockListCounts(5, 0)).toBe("5 mocks");
    expect(formatMockListCounts(1, 0)).toBe("1 mock");
    expect(formatMockListCounts(0, 0)).toBe("0 mocks");
  });

  it("shows matches out of the total when filtering, hiding disabled", () => {
    expect(formatMockListCounts(5, 2, 2)).toBe("2 of 5 mocks");
    expect(formatMockListCounts(5, 2, 0)).toBe("0 of 5 mocks");
    expect(formatMockListCounts(5, 2, 5)).toBe("5 of 5 mocks");
    expect(formatMockListCounts(1, 0, 1)).toBe("1 of 1 mock");
  });
});
