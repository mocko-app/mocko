import { normalizeLabel } from "./filter";

export type MockListParams = {
  search: string;
  labels: string[];
};

export function buildMockListUrl(search: string, labels: string[]): string {
  const searchParams = new URLSearchParams();
  if (search) {
    searchParams.set("q", search);
  }
  for (const label of labels) {
    if (label) {
      searchParams.append("label", label);
    }
  }

  const query = searchParams.toString();
  if (!query) {
    return "/mocks";
  }

  return `/mocks?${query}`;
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
