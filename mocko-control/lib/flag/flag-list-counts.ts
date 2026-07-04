import type { FlagListDto } from "@/lib/types/flag-dtos";

type FlagListCounts = Pick<FlagListDto, "isTruncated" | "count" | "matchCount">;

export function formatFlagListCounts(
  list: FlagListCounts,
  hasSearch: boolean,
): string | undefined {
  if (list.count === undefined) {
    return undefined;
  }

  if (hasSearch) {
    if (list.matchCount === undefined) {
      return undefined;
    }
    if (list.isTruncated) {
      const matchNoun = list.matchCount === 1 ? "match" : "matches";
      return `${list.matchCount.toLocaleString()}+ ${matchNoun}`;
    }
    return `${list.matchCount.toLocaleString()} of ${list.count.toLocaleString()} ${flagNoun(list.count)}`;
  }

  const suffix = list.isTruncated ? "+" : "";
  return `${list.count.toLocaleString()}${suffix} ${flagNoun(list.count)}`;
}

function flagNoun(count: number): string {
  return count === 1 ? "flag" : "flags";
}
