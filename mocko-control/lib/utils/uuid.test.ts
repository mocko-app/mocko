import { describe, expect, it } from "vitest";
import { uuidv5 } from "@/lib/utils/uuid";

describe("uuidv5", () => {
  it("matches the RFC 4122 v5 output for a known name", () => {
    expect(
      uuidv5("www.example.com", "6ba7b810-9dad-11d1-80b4-00c04fd430c8"),
    ).toBe("2ed6657d-e927-568b-95e1-2665a8aea6a2");
  });
});
