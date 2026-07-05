import type { MetadataRoute } from "next";
import { docsNavItems, docsV1NavGroups } from "@/components/docs/nav-data";

export const dynamic = "force-static";

const BASE_URL = "https://mocko.dev/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  const hrefs = [
    ...docsNavItems.map((item) => item.href),
    ...docsV1NavGroups.flatMap((group) => group.items.map((item) => item.href)),
  ];

  return [...new Set(hrefs)].map((href) => ({
    url: href === "/" ? BASE_URL : `${BASE_URL}${href}`,
    priority:
      href === "/" || href === "/getting-started"
        ? 1
        : href.startsWith("/v1")
          ? 0.3
          : 0.7,
  }));
}
