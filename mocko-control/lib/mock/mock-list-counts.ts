export function formatMockListCounts(
  total: number,
  disabledCount: number,
  matchCount?: number,
): string {
  const noun = total === 1 ? "mock" : "mocks";
  if (matchCount !== undefined) {
    return `${matchCount} of ${total} ${noun}`;
  }
  if (disabledCount > 0) {
    return `${total} ${noun} · ${disabledCount} disabled`;
  }
  return `${total} ${noun}`;
}
