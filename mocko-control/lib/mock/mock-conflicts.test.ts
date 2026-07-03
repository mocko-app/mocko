import { describe, expect, it } from "vitest";
import type { Mock } from "@/lib/types/mock";
import {
  computeMockConflicts,
  resolveMockConflict,
} from "@/lib/mock/mock-conflicts";

let counter = 0;

function aMock(overrides: Partial<Mock> = {}): Mock {
  counter += 1;
  return {
    id: `mock-${counter}`,
    name: `Mock ${counter}`,
    method: "GET",
    path: "/same",
    host: undefined,
    filePath: undefined,
    format: undefined,
    response: { code: 200, headers: {} },
    isEnabled: true,
    labels: [],
    annotations: [],
    ...overrides,
  };
}

function uiMock(overrides: Partial<Mock> = {}): Mock {
  return aMock(overrides);
}

function fileMock(overrides: Partial<Mock> = {}): Mock {
  return aMock({
    filePath: "mocks/a.hcl",
    annotations: ["READ_ONLY"],
    ...overrides,
  });
}

describe("computeMockConflicts", () => {
  it("does not flag mocks that never collide", () => {
    const conflicts = computeMockConflicts([
      aMock({ path: "/a" }),
      aMock({ path: "/b" }),
      aMock({ method: "POST", path: "/a" }),
    ]);
    expect(conflicts.size).toBe(0);
  });

  it("distinguishes collisions by host", () => {
    const conflicts = computeMockConflicts([
      uiMock({ host: "a.example.com" }),
      uiMock({ host: "b.example.com" }),
    ]);
    expect(conflicts.size).toBe(0);
  });

  it("marks the file as shadowed and the UI mock as active for 1 UI + 1 file", () => {
    const ui = uiMock();
    const file = fileMock();
    const conflicts = computeMockConflicts([ui, file]);

    expect(conflicts.get(ui.id)).toEqual({
      role: "active",
      related: [file.id],
    });
    expect(conflicts.get(file.id)).toEqual({
      role: "shadowed",
      related: [ui.id],
    });
  });

  it("flags two UI mocks as a mutual conflict", () => {
    const a = uiMock();
    const b = uiMock();
    const conflicts = computeMockConflicts([a, b]);

    expect(conflicts.get(a.id)).toEqual({ role: "conflict", related: [b.id] });
    expect(conflicts.get(b.id)).toEqual({ role: "conflict", related: [a.id] });
  });

  it("flags two file mocks as a mutual conflict (the duplicate-file bug)", () => {
    const a = fileMock();
    const b = fileMock();
    const conflicts = computeMockConflicts([a, b]);

    expect(conflicts.get(a.id)?.role).toBe("conflict");
    expect(conflicts.get(b.id)?.role).toBe("conflict");
  });

  it("flags every member of a 3-way group as conflict (2 UI + 1 file)", () => {
    const a = uiMock();
    const b = uiMock();
    const file = fileMock();
    const conflicts = computeMockConflicts([a, b, file]);

    expect(conflicts.get(a.id)?.role).toBe("conflict");
    expect(conflicts.get(b.id)?.role).toBe("conflict");
    expect(conflicts.get(file.id)?.role).toBe("conflict");
    expect(conflicts.get(a.id)?.related).toEqual(
      expect.arrayContaining([b.id, file.id]),
    );
  });

  it("flags every member of a 3-way group as conflict (1 UI + 2 files)", () => {
    const ui = uiMock();
    const fileA = fileMock();
    const fileB = fileMock();
    const conflicts = computeMockConflicts([ui, fileA, fileB]);

    expect(conflicts.get(ui.id)?.role).toBe("conflict");
    expect(conflicts.get(fileA.id)?.role).toBe("conflict");
    expect(conflicts.get(fileB.id)?.role).toBe("conflict");
  });

  it("ignores disabled mocks entirely", () => {
    const enabled = uiMock();
    const disabled = fileMock({ isEnabled: false });
    const conflicts = computeMockConflicts([enabled, disabled]);
    expect(conflicts.size).toBe(0);
  });

  it("does not let a disabled mock make an otherwise-clean pair a conflict", () => {
    const ui = uiMock();
    const file = fileMock();
    const disabledUi = uiMock({ isEnabled: false });
    const conflicts = computeMockConflicts([ui, file, disabledUi]);

    // Only the enabled UI + file remain → clean shadow, not a conflict.
    expect(conflicts.get(ui.id)?.role).toBe("active");
    expect(conflicts.get(file.id)?.role).toBe("shadowed");
    expect(conflicts.has(disabledUi.id)).toBe(false);
  });

  it("is stable regardless of file-mock ordering (never picks a file winner)", () => {
    const a = fileMock({ id: "file-a" });
    const b = fileMock({ id: "file-b" });
    const forward = computeMockConflicts([a, b]);
    const reversed = computeMockConflicts([b, a]);

    expect(forward.get("file-a")?.role).toBe(reversed.get("file-a")?.role);
    expect(forward.get("file-b")?.role).toBe(reversed.get("file-b")?.role);
    expect(forward.get("file-a")?.role).toBe("conflict");
  });
});

describe("resolveMockConflict", () => {
  it("returns null when the mock has no conflict", () => {
    const mocks = [aMock({ path: "/a" }), aMock({ path: "/b" })];
    const conflicts = computeMockConflicts(mocks);
    expect(resolveMockConflict(mocks[0].id, conflicts, mocks)).toBeNull();
  });

  it("resolves related ids into compact summaries with source", () => {
    const ui = uiMock({ name: "UI override" });
    const file = fileMock({ name: "File mock", filePath: "mocks/x.hcl" });
    const mocks = [ui, file];
    const conflicts = computeMockConflicts(mocks);

    const shadowed = resolveMockConflict(file.id, conflicts, mocks);
    expect(shadowed).toEqual({
      role: "shadowed",
      related: [
        {
          id: ui.id,
          name: "UI override",
          method: "GET",
          path: "/same",
          host: undefined,
          filePath: undefined,
          source: "UI",
        },
      ],
    });

    const active = resolveMockConflict(ui.id, conflicts, mocks);
    expect(active?.role).toBe("active");
    expect(active?.related[0]).toMatchObject({
      id: file.id,
      source: "FILE",
      filePath: "mocks/x.hcl",
    });
  });
});
