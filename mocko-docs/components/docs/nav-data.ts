export type DocsNavItem = {
  title: string;
  href: string;
};

export type DocsNavGroup = {
  title: string;
  items: DocsNavItem[];
};

export const docsNavGroups: DocsNavGroup[] = [
  {
    title: "Getting Started",
    items: [{ title: "Getting Started", href: "/docs/getting-started" }],
  },
  {
    title: "Creating Mocks",
    items: [
      { title: "File Mocks", href: "/docs/creating-mocks/file-mocks" },
      { title: "UI Mocks", href: "/docs/creating-mocks/ui-mocks" },
      { title: "How Matching Works", href: "/docs/creating-mocks/matching" },
      { title: "Templating", href: "/docs/creating-mocks/templating" },
      { title: "Flags", href: "/docs/creating-mocks/flags" },
      {
        title: "Proxying and Hosts",
        href: "/docs/creating-mocks/proxying-and-hosts",
      },
      { title: "Data Blocks", href: "/docs/creating-mocks/data-blocks" },
      { title: "Recipes", href: "/docs/creating-mocks/recipes" },
    ],
  },
  {
    title: "Local Dev",
    items: [
      { title: "CLI with UI", href: "/docs/local/cli-ui" },
      { title: "CLI with File Mocks", href: "/docs/local/cli-file-mocks" },
      { title: "Docker Compose", href: "/docs/local/compose" },
    ],
  },
  {
    title: "Self-hosted",
    items: [
      { title: "Docker image", href: "/docs/self-hosted/docker" },
      { title: "Helm / Kubernetes", href: "/docs/self-hosted/helm" },
      { title: "With Redis", href: "/docs/self-hosted/redis" },
    ],
  },
  {
    title: "Mocko Cloud",
    items: [
      { title: "Overview", href: "/docs/cloud/overview" },
      { title: "Public mocks", href: "/docs/cloud/public-mocks" },
      { title: "Webhooks", href: "/docs/cloud/webhooks" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "HCL syntax", href: "/docs/reference/hcl" },
      { title: "Bigodon syntax", href: "/docs/reference/bigodon" },
      { title: "Template helpers", href: "/docs/reference/helpers" },
      { title: "CLI reference", href: "/docs/reference/cli" },
      { title: "v1 to v2 migration", href: "/docs/reference/v1-to-v2" },
    ],
  },
];

export const docsHomeItem: DocsNavItem = {
  title: "Overview",
  href: "/docs",
};

export const docsLegacyItem: DocsNavItem = {
  title: "Legacy v1 docs",
  href: "/docs/v1",
};

export const docsNavItems = [
  docsHomeItem,
  ...docsNavGroups.flatMap((group) => group.items),
  docsLegacyItem,
];

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/docs") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavItemBySlug(slug: string[]) {
  const href = `/docs/${slug.join("/")}`;
  return docsNavItems.find((item) => item.href === href);
}

export function getTitleFromSlug(slug: string[]) {
  return findNavItemBySlug(slug)?.title ?? "Documentation";
}

// ── v1 nav ────────────────────────────────────────────────────────────────────

export const docsV1HomeItem: DocsNavItem = {
  title: "Overview",
  href: "/docs/v1",
};

export const docsV1NavGroups: DocsNavGroup[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Standalone",
        href: "/docs/v1/getting-started/standalone",
      },
      {
        title: "Complete Stack",
        href: "/docs/v1/getting-started/complete",
      },
    ],
  },
  {
    title: "Templating",
    items: [
      { title: "Getting Started", href: "/docs/v1/templating" },
      { title: "Helpers", href: "/docs/v1/templating/helpers" },
      { title: "Persistence", href: "/docs/v1/templating/persistence" },
      { title: "Variables", href: "/docs/v1/templating/variables" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Deploying", href: "/docs/v1/deploying" },
      { title: "Updating Node", href: "/docs/v1/updating-node" },
    ],
  },
];

export function getNavGroupTitleForHref(href: string) {
  if (href === "/docs") {
    return "Overview";
  }

  if (href === docsLegacyItem.href) {
    return "Legacy";
  }

  return docsNavGroups.find((group) =>
    group.items.some((item) => item.href === href),
  )?.title;
}
