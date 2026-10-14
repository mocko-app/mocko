export type CallbackListParams = {
  search: string;
};

function withSearch(pathname: string, search: string): string {
  if (!search) {
    return pathname;
  }

  return `${pathname}?${new URLSearchParams({ q: search }).toString()}`;
}

export function buildCallbackListUrl(search: string): string {
  return withSearch("/callbacks", search);
}

export function buildCallbackUrl(id: string, search: string): string {
  return withSearch(`/callbacks/${id}`, search);
}

export function buildNewCallbackUrl(search: string): string {
  return withSearch("/callbacks/new", search);
}

export function parseCallbackListParams(
  searchParams: URLSearchParams,
): CallbackListParams {
  return { search: searchParams.get("q") ?? "" };
}
