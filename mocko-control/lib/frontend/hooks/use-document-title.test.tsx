import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDocumentTitle } from "./use-document-title";

describe("useDocumentTitle", () => {
  it("suffixes the title with the app name", () => {
    renderHook(() => useDocumentTitle("Mocks"));
    expect(document.title).toBe("Mocks · Mocko");
  });

  it("updates the title when it changes", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) => useDocumentTitle(title),
      { initialProps: { title: "New mock" } },
    );
    expect(document.title).toBe("New mock · Mocko");

    rerender({ title: "Edit: Get user" });
    expect(document.title).toBe("Edit: Get user · Mocko");
  });

  it("leaves the current title untouched while undefined", () => {
    document.title = "Existing title";
    renderHook(() => useDocumentTitle(undefined));
    expect(document.title).toBe("Existing title");
  });
});
