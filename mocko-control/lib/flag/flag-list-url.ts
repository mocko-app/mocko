export function buildFlagListUrl(
  basePath: string,
  prefix?: string,
  search?: string,
): string {
  const searchParams = new URLSearchParams();
  if (prefix) {
    searchParams.set("prefix", prefix);
  }
  if (search) {
    searchParams.set("q", search);
  }

  const query = searchParams.toString();
  if (!query) {
    return basePath;
  }

  return `${basePath}?${query}`;
}
