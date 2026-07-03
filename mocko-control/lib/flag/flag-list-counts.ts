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
      return `${list.matchCount}+ ${matchNoun}`;
    }
    return `${list.matchCount} of ${list.count} ${flagNoun(list.count)}`;
  }

  const suffix = list.isTruncated ? "+" : "";
  return `${list.count}${suffix} ${flagNoun(list.count)}`;
}

function flagNoun(count: number): string {
  return count === 1 ? "flag" : "flags";
}
