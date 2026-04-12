import type { MockDto } from "../types/mock-dtos";
import { UNLABELED_KEY } from "../utils/labels";

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

export function getOrderedLabelFilterKeys(
  visibleLabels: string[],
  selectedLabels: string[],
  hasUnlabeled: boolean,
): string[] {
  const normalizedSelected = getNormalizedSelectedLabels(selectedLabels);
  const unlabeledSelected = selectedLabels.includes(UNLABELED_KEY);
  const displayByNormalized = new Map<string, string>();

  for (const label of visibleLabels) {
    displayByNormalized.set(normalizeLabel(label), label);
  }

  for (const label of selectedLabels) {
    if (label === UNLABELED_KEY) continue;
    displayByNormalized.set(normalizeLabel(label), label);
  }

  const selectedVisibleLabels = selectedLabels.filter(
    (label) =>
      label !== UNLABELED_KEY && displayByNormalized.has(normalizeLabel(label)),
  );
  const remainingVisibleLabels = visibleLabels.filter(
    (label) => !normalizedSelected.has(normalizeLabel(label)),
  );

  const allKeys = [
    ...selectedVisibleLabels.map(
      (label) => displayByNormalized.get(normalizeLabel(label)) ?? label,
    ),
    ...(unlabeledSelected ? [UNLABELED_KEY] : []),
    ...remainingVisibleLabels,
  ];

  if (hasUnlabeled && !unlabeledSelected) {
    allKeys.push(UNLABELED_KEY);
  }

  return allKeys;
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
