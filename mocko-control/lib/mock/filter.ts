import type { MockDto } from "../types/mock-dtos";
import {
  compareLabelsByCount,
  getAvailableLabels,
  UNLABELED_KEY,
} from "../utils/labels";

export function matchesMockSearch(mock: MockDto, search: string): boolean {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  const searchableFields = [
    mock.name,
    mock.path,
    mock.method,
    mock.filePath ?? "",
    ...mock.labels,
  ];

  return searchableFields.some((value) => value.toLowerCase().includes(query));
}

export function normalizeLabel(label: string): string {
  return label.toLowerCase();
}

export function getNormalizedSelectedLabels(
  selectedLabels: string[],
): Set<string> {
  return new Set(
    selectedLabels
      .filter((label) => label !== UNLABELED_KEY)
      .map(normalizeLabel),
  );
}

export function filterMocks(
  mocks: MockDto[],
  search: string,
  selectedLabels: string[],
): MockDto[] {
  let result = mocks;

  if (search) {
    result = result.filter((mock) => matchesMockSearch(mock, search));
  }

  if (selectedLabels.length > 0) {
    result = result.filter((mock) => {
      const normalized = mock.labels.map(normalizeLabel);
      return selectedLabels.every((selected) =>
        selected === UNLABELED_KEY
          ? mock.labels.length === 0
          : normalized.includes(normalizeLabel(selected)),
      );
    });
  }

  return result;
}

export function getLabelFilterKeys(
  mocks: Pick<MockDto, "labels">[],
  filtered: Pick<MockDto, "labels">[],
  selectedLabels: string[],
): string[] {
  const countByNormalized = new Map<string, number>();
  const displayByNormalized = new Map<string, string>();

  for (const mock of mocks) {
    for (const label of mock.labels) {
      const normalized = normalizeLabel(label);
      countByNormalized.set(
        normalized,
        (countByNormalized.get(normalized) ?? 0) + 1,
      );
      if (!displayByNormalized.has(normalized)) {
        displayByNormalized.set(normalized, label);
      }
    }
  }

  const selectedKeys: string[] = [];
  const seen = new Set<string>();
  for (const label of selectedLabels) {
    if (label === UNLABELED_KEY) continue;
    const normalized = normalizeLabel(label);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    selectedKeys.push(displayByNormalized.get(normalized) ?? label);
  }
  selectedKeys.sort(
    compareLabelsByCount(
      (normalized) => countByNormalized.get(normalized) ?? 0,
    ),
  );

  const unselectedVisible = getAvailableLabels(filtered).filter(
    (label) => !seen.has(normalizeLabel(label)),
  );

  const anyMockHasLabels = countByNormalized.size > 0;
  const showUnlabeled =
    selectedLabels.includes(UNLABELED_KEY) ||
    (anyMockHasLabels && filtered.some((mock) => mock.labels.length === 0));

  return [
    ...selectedKeys,
    ...unselectedVisible,
    ...(showUnlabeled ? [UNLABELED_KEY] : []),
  ];
}

export function isLabelFilterSelected(
  key: string,
  selectedLabels: string[],
): boolean {
  if (key === UNLABELED_KEY) {
    return selectedLabels.includes(UNLABELED_KEY);
  }

  return getNormalizedSelectedLabels(selectedLabels).has(normalizeLabel(key));
}

export function toggleLabelFilter(
  selectedLabels: string[],
  key: string,
): string[] {
  if (key === UNLABELED_KEY) {
    if (selectedLabels.includes(UNLABELED_KEY)) {
      return selectedLabels.filter((label) => label !== UNLABELED_KEY);
    }

    return [...selectedLabels, key];
  }

  const normalizedSelected = getNormalizedSelectedLabels(selectedLabels);
  const normalizedKey = normalizeLabel(key);

  if (normalizedSelected.has(normalizedKey)) {
    return selectedLabels.filter(
      (label) =>
        label === UNLABELED_KEY || normalizeLabel(label) !== normalizedKey,
    );
  }

  return [...selectedLabels, key];
}
