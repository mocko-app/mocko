export type Crumb = { label: string; href?: string };

export function parsePrefixCrumbs(prefix: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Flags", href: "/flags" }];
  if (!prefix) {
    return crumbs;
  }

  const parts = prefix.split(":").filter(Boolean);
  let acc = "";
  for (const part of parts) {
    acc += `${part}:`;
    crumbs.push({ label: part, href: `/flags?prefix=${acc}` });
  }

  return crumbs;
}

export function parseFlagKeyCrumbs(key: string): Crumb[] {
  const parts = key.split(":");
  const crumbs: Crumb[] = [{ label: "Flags", href: "/flags" }];
  let acc = "";

  for (let i = 0; i < parts.length - 1; i += 1) {
    acc += `${parts[i]}:`;
    crumbs.push({ label: parts[i], href: `/flags?prefix=${acc}` });
  }

  crumbs.push({ label: parts[parts.length - 1] });
  return crumbs;
}

export function getParentHref(key: string): string {
  const parts = key.split(":");
  if (parts.length === 1) {
    return "/flags";
  }

  return `/flags?prefix=${parts.slice(0, -1).join(":")}:`;
}
