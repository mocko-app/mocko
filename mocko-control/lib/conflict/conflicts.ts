import type {
  ConflictDto,
  ConflictOrigin,
  ConflictRole,
} from "@/lib/types/conflict-dtos";
import type { DisplayMockAnnotation, MockAnnotation } from "@/lib/types/mock";

export interface Conflict {
  role: ConflictRole;
  related: string[];
}

type ConflictCandidate = {
  id: string;
  annotations: readonly MockAnnotation[];
};

export function isFileDefinition(item: {
  annotations: readonly MockAnnotation[];
}): boolean {
  return item.annotations.includes("READ_ONLY");
}

export function originOf(item: {
  annotations: readonly MockAnnotation[];
}): ConflictOrigin {
  return isFileDefinition(item) ? "FILE" : "UI";
}

export function computeConflicts<T extends ConflictCandidate>(
  items: T[],
  keyOf: (item: T) => string,
): Map<string, Conflict> {
  const result = new Map<string, Conflict>();
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  for (const group of groups.values()) {
    if (group.length < 2) {
      continue;
    }

    const files = group.filter(isFileDefinition);
    const ui = group.filter((item) => !isFileDefinition(item));

    if (ui.length === 1 && files.length === 1) {
      result.set(ui[0].id, { role: "active", related: [files[0].id] });
      result.set(files[0].id, { role: "shadowed", related: [ui[0].id] });
      continue;
    }

    for (const item of group) {
      result.set(item.id, {
        role: "conflict",
        related: group
          .filter((other) => other.id !== item.id)
          .map((other) => other.id),
      });
    }
  }

  return result;
}

export function resolveConflict<T extends ConflictCandidate, TSummary>(
  id: string,
  conflicts: Map<string, Conflict>,
  items: T[],
  toSummary: (item: T) => TSummary,
): ConflictDto<TSummary> | null {
  const conflict = conflicts.get(id);
  if (!conflict) {
    return null;
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const related = conflict.related
    .map((relatedId) => byId.get(relatedId))
    .filter((item): item is T => item !== undefined)
    .map(toSummary);

  return { role: conflict.role, related };
}

export function annotationsWithConflict(
  annotations: readonly MockAnnotation[],
  role: ConflictRole | undefined,
): DisplayMockAnnotation[] {
  const result: DisplayMockAnnotation[] = [...annotations];
  if (role === "shadowed") {
    result.push("SHADOWED");
  } else if (role === "conflict") {
    result.push("CONFLICT");
  }
  return result;
}
