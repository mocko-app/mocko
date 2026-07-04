import { buildFlagListUrl } from "@/lib/flag/flag-list-url";

export type Crumb = { label: string; href?: string };

export function parsePrefixCrumbs(prefix: string, query?: string): Crumb[] {
  const crumbs: Crumb[] = [
    { label: "Flags", href: buildFlagListUrl("/flags", undefined, query) },
  ];
  if (!prefix) {
    return crumbs;
  }

  const parts = prefix.split(":").filter(Boolean);
  let acc = "";
  for (const part of parts) {
    acc += `${part}:`;
    crumbs.push({ label: part, href: buildFlagListUrl("/flags", acc, query) });
  }

  return crumbs;
}

export function parseFlagKeyCrumbs(key: string, query?: string): Crumb[] {
  const parts = key.split(":");
  const crumbs: Crumb[] = [
    { label: "Flags", href: buildFlagListUrl("/flags", undefined, query) },
  ];
  let acc = "";

  for (let i = 0; i < parts.length - 1; i += 1) {
    acc += `${parts[i]}:`;
    crumbs.push({
      label: parts[i],
      href: buildFlagListUrl("/flags", acc, query),
    });
  }

  crumbs.push({ label: parts[parts.length - 1] });
  return crumbs;
}

export function getParentHref(key: string, query?: string): string {
  const parts = key.split(":");
  const prefix =
    parts.length === 1 ? undefined : `${parts.slice(0, -1).join(":")}:`;
  return buildFlagListUrl("/flags", prefix, query);
}
