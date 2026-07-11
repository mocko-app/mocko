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
    items: [
      { title: "Getting Started", href: "/getting-started" },
      { title: "Coding Agents", href: "/coding-agents" },
    ],
  },
  {
    title: "Creating Mocks",
    items: [
      { title: "File Mocks", href: "/creating-mocks/file-mocks" },
      { title: "UI Mocks", href: "/creating-mocks/ui-mocks" },
      { title: "Templating", href: "/creating-mocks/templating" },
      { title: "How Matching Works", href: "/creating-mocks/matching" },
      { title: "Flags", href: "/creating-mocks/flags" },
      {
        title: "Proxying and Hosts",
        href: "/creating-mocks/proxying-and-hosts",
      },
      { title: "Data Blocks", href: "/creating-mocks/data-blocks" },
    ],
  },
  {
    title: "Recipes",
    items: [
      { title: "Overview", href: "/recipes" },
      { title: "Stateful CRUD", href: "/recipes/stateful-crud" },
      {
        title: "List and Detail From Data",
        href: "/recipes/list-and-detail",
      },
      { title: "Append to a List", href: "/recipes/append-to-list" },
      { title: "Mock One Edge Case", href: "/recipes/mock-one-edge-case" },
      {
        title: "Simulate Slow or Unstable APIs",
        href: "/recipes/slow-unstable-apis",
      },
      { title: "Polling Status Flow", href: "/recipes/polling-status" },
      { title: "Debug Broken JSON", href: "/recipes/debug-broken-json" },
      {
        title: "Mock Microservices by Host",
        href: "/recipes/microservices-by-host",
      },
    ],
  },
  {
    title: "Testing with the SDK",
    items: [
      { title: "Getting Started", href: "/sdk/getting-started" },
      { title: "Flag Definitions", href: "/sdk/flag-definitions" },
      { title: "Auth and Deployment", href: "/sdk/auth" },
    ],
  },
  {
    title: "Running Mocko",
    items: [
      { title: "CLI", href: "/running/cli" },
      { title: "Docker Compose", href: "/running/compose" },
      { title: "Docker Images", href: "/running/docker" },
      { title: "Kubernetes with Helm", href: "/running/helm" },
      { title: "Persistence and Redis", href: "/running/persistence" },
    ],
  },
  {
    title: "Mocko Cloud",
    items: [
      { title: "Overview", href: "/cloud" },
      { title: "Getting Started", href: "/cloud/getting-started" },
      { title: "Projects and URLs", href: "/cloud/projects" },
      { title: "Local Tunnels", href: "/cloud/tunnels" },
      { title: "Request Logs", href: "/cloud/logs" },
      { title: "Team Members", href: "/cloud/team" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Configuration", href: "/reference/configuration" },
      { title: "CLI", href: "/reference/cli" },
      { title: "Mock Files (HCL)", href: "/reference/mock-files" },
      { title: "Template Helpers", href: "/reference/helpers" },
      { title: "Bigodon", href: "/reference/bigodon" },
      { title: "Operations", href: "/reference/operations" },
      { title: "Migrating from v1", href: "/reference/v1-migration" },
    ],
  },
];

export const docsHomeItem: DocsNavItem = {
  title: "Overview",
  href: "/",
};

export const docsLegacyItem: DocsNavItem = {
  title: "Legacy v1 docs",
  href: "/v1",
};

export const docsNavItems = [
  docsHomeItem,
  ...docsNavGroups.flatMap((group) => group.items),
  docsLegacyItem,
];

export function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (href === "/" || !pathname.startsWith(`${href}/`)) {
    return false;
  }

  return !allNavHrefs().some(
    (other) =>
      other.length > href.length &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  );
}

function allNavHrefs() {
  return [
    ...docsNavItems.map((item) => item.href),
    ...docsV1NavGroups.flatMap((group) => group.items.map((item) => item.href)),
  ];
}

// ── v1 nav ────────────────────────────────────────────────────────────────────

export const docsV1HomeItem: DocsNavItem = {
  title: "Overview",
  href: "/v1",
};

export const docsV1NavGroups: DocsNavGroup[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Standalone",
        href: "/v1/getting-started/standalone",
      },
      {
        title: "Complete Stack",
        href: "/v1/getting-started/complete",
      },
    ],
  },
  {
    title: "Templating",
    items: [
      { title: "Getting Started", href: "/v1/templating" },
      { title: "Helpers", href: "/v1/templating/helpers" },
      { title: "Persistence", href: "/v1/templating/persistence" },
      { title: "Variables", href: "/v1/templating/variables" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Deploying", href: "/v1/deploying" },
      { title: "Updating Node", href: "/v1/updating-node" },
    ],
  },
];
