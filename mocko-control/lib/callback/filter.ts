import type { CallbackDto } from "../types/callback-dtos";

export function matchesCallbackSearch(
  callback: CallbackDto,
  search: string,
): boolean {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  const searchableFields = [
    callback.slug,
    callback.name ?? "",
    callback.method,
    callback.url ?? "",
    callback.host ? `@${callback.host}` : "",
    callback.path ?? "",
  ];

  return searchableFields.some((value) => value.toLowerCase().includes(query));
}

export function filterCallbacks(
  callbacks: CallbackDto[],
  search: string,
): CallbackDto[] {
  if (!search) {
    return callbacks;
  }

  return callbacks.filter((callback) =>
    matchesCallbackSearch(callback, search),
  );
}
