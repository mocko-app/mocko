export function buildNewHostUrl(from: string): string {
  return `/hosts/new?${new URLSearchParams({ from }).toString()}`;
}
