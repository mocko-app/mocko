import type { Metadata } from "next";
import Link from "next/link";
import {
  DocsEyebrow,
  DocsLead,
  DocsLink,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Recipes",
  description:
    "Practical Mocko recipes: stateful CRUD, data-driven endpoints, append-only lists, edge cases, slow APIs, polling flows, debugging, and microservices.",
};

const recipes = [
  {
    title: "Stateful CRUD",
    href: "/recipes/stateful-crud",
    description:
      "A complete create, read, update, and delete API backed by flags.",
  },
  {
    title: "List and Detail From Data",
    href: "/recipes/list-and-detail",
    description:
      "Serve a collection and a detail endpoint with 404s from one data block.",
  },
  {
    title: "Append to a List",
    href: "/recipes/append-to-list",
    description:
      "Accept submissions with POST and return the accumulated list with GET.",
  },
  {
    title: "Mock One Edge Case",
    href: "/recipes/mock-one-edge-case",
    description:
      "Proxy normal traffic to the real backend while mocking one branch.",
  },
  {
    title: "Simulate Slow or Unstable APIs",
    href: "/recipes/slow-unstable-apis",
    description:
      "Add latency and random failures in front of an otherwise healthy API.",
  },
  {
    title: "Polling Status Flow",
    href: "/recipes/polling-status",
    description:
      "Return changing statuses for async jobs, exports, and polling UIs.",
  },
  {
    title: "Debug Broken JSON",
    href: "/recipes/debug-broken-json",
    description:
      "Track down trailing commas, empty values, and other template bugs.",
  },
  {
    title: "Mock Microservices by Host",
    href: "/recipes/microservices-by-host",
    description:
      "Stand in for several services with one instance using host blocks.",
  },
] as const;

export default function RecipesPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Recipes</DocsEyebrow>
      <DocsTitle>Recipes</DocsTitle>
      <DocsLead>
        Recipes combine mocks, templates, flags, data blocks, and proxying into
        complete behaviors you can copy into your project. Each one is a working
        mock file plus a walkthrough of the moving parts.
      </DocsLead>

      <div className="mb-8 grid gap-3 md:grid-cols-2">
        {recipes.map((recipe) => (
          <Link
            key={recipe.href}
            href={recipe.href}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-fg-2/30 hover:bg-card/70"
          >
            <p className="mb-1 text-[13px] font-semibold text-foreground">
              {recipe.title}
            </p>
            <p className="text-[12px] leading-[1.65] text-muted-foreground">
              {recipe.description}
            </p>
          </Link>
        ))}
      </div>

      <DocsP>
        The recipes assume you know the basics from the{" "}
        <DocsLink href="/creating-mocks/file-mocks">Creating Mocks</DocsLink>{" "}
        section, but each page links back to the concepts it uses, so it is safe
        to jump straight to the one that matches your problem.
      </DocsP>
    </DocsPage>
  );
}
