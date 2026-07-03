import type { Mock } from "@/lib/types/mock";
import type {
  MockConflictDto,
  MockConflictRole,
  MockSummaryDto,
} from "@/lib/types/mock-dtos";

export interface MockConflict {
  role: MockConflictRole;
  related: string[];
}

function conflictKey(mock: Mock): string {
  return `${mock.host ?? ""}\u0000${mock.method}\u0000${mock.path}`;
}

function isFileMock(mock: Mock): boolean {
  return mock.annotations.includes("READ_ONLY");
}

export function computeMockConflicts(mocks: Mock[]): Map<string, MockConflict> {
  const result = new Map<string, MockConflict>();
  const groups = new Map<string, Mock[]>();

  for (const mock of mocks) {
    if (!mock.isEnabled) {
      continue;
    }
    const key = conflictKey(mock);
    const group = groups.get(key);
    if (group) {
      group.push(mock);
    } else {
      groups.set(key, [mock]);
    }
  }

  for (const group of groups.values()) {
    if (group.length < 2) {
      continue;
    }

    const files = group.filter(isFileMock);
    const ui = group.filter((mock) => !isFileMock(mock));

    if (ui.length === 1 && files.length === 1) {
      result.set(ui[0].id, { role: "active", related: [files[0].id] });
      result.set(files[0].id, { role: "shadowed", related: [ui[0].id] });
      continue;
    }

    for (const mock of group) {
      result.set(mock.id, {
        role: "conflict",
        related: group
          .filter((other) => other.id !== mock.id)
          .map((other) => other.id),
      });
    }
  }

  return result;
}

export function toMockSummary(mock: Mock): MockSummaryDto {
  return {
    id: mock.id,
    name: mock.name,
    method: mock.method,
    path: mock.path,
    host: mock.host,
    filePath: mock.filePath,
    source: isFileMock(mock) ? "FILE" : "UI",
  };
}

export function resolveMockConflict(
  mockId: string,
  conflicts: Map<string, MockConflict>,
  mocks: Mock[],
): MockConflictDto | null {
  const conflict = conflicts.get(mockId);
  if (!conflict) {
    return null;
  }

  const byId = new Map(mocks.map((mock) => [mock.id, mock]));
  const related = conflict.related
    .map((id) => byId.get(id))
    .filter((mock): mock is Mock => mock !== undefined)
    .map(toMockSummary);

  return { role: conflict.role, related };
}
