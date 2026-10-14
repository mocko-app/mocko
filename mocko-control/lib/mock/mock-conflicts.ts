import {
  computeConflicts,
  originOf,
  resolveConflict,
  type Conflict,
} from "@/lib/conflict/conflicts";
import type { Mock } from "@/lib/types/mock";
import type { MockConflictDto, MockSummaryDto } from "@/lib/types/mock-dtos";

export type MockConflict = Conflict;

function conflictKey(mock: Mock): string {
  return `${mock.host ?? ""}\u0000${mock.method}\u0000${mock.path}`;
}

export function computeMockConflicts(mocks: Mock[]): Map<string, MockConflict> {
  return computeConflicts(
    mocks.filter((mock) => mock.isEnabled),
    conflictKey,
  );
}

export function toMockSummary(mock: Mock): MockSummaryDto {
  return {
    id: mock.id,
    name: mock.name,
    method: mock.method,
    path: mock.path,
    host: mock.host,
    filePath: mock.filePath,
    source: originOf(mock),
  };
}

export function resolveMockConflict(
  mockId: string,
  conflicts: Map<string, MockConflict>,
  mocks: Mock[],
): MockConflictDto | null {
  return resolveConflict(mockId, conflicts, mocks, toMockSummary);
}
