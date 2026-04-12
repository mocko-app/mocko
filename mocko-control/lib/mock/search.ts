import type { MockDto } from "../types/mock-dtos";

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
