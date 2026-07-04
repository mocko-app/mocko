import { normalizeLabel } from "./filter";

export type MockListParams = {
  search: string;
  labels: string[];
};

function appendListParams(
  searchParams: URLSearchParams,
  search: string,
  labels: string[],
): void {
  if (search) {
    searchParams.set("q", search);
  }
  for (const label of labels) {
    if (label) {
      searchParams.append("label", label);
    }
  }
}

function toQuerySuffix(searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function buildMockListUrl(search: string, labels: string[]): string {
  const searchParams = new URLSearchParams();
  appendListParams(searchParams, search, labels);
  return `/mocks${toQuerySuffix(searchParams)}`;
}

export function buildMockUrl(
  id: string,
  search: string,
  labels: string[],
): string {
  const searchParams = new URLSearchParams();
  appendListParams(searchParams, search, labels);
  return `/mocks/${id}${toQuerySuffix(searchParams)}`;
}

export function buildNewMockUrl(
  search: string,
  labels: string[],
  from?: string,
): string {
  const searchParams = new URLSearchParams();
  if (from) {
    searchParams.set("from", from);
  }
  appendListParams(searchParams, search, labels);
  return `/mocks/new${toQuerySuffix(searchParams)}`;
}

export function parseMockListParams(
  searchParams: URLSearchParams,
): MockListParams {
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const label of searchParams.getAll("label")) {
    if (!label) continue;
    const normalized = normalizeLabel(label);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    labels.push(label);
  }

  return { search: searchParams.get("q") ?? "", labels };
}
