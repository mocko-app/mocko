import type { Metadata } from "next";
import Link from "next/link";
import { CloudIcon, RocketIcon, ServerIcon } from "lucide-react";
import type { ComponentType } from "react";
import {
  DocsEyebrow,
  DocsLead,
  DocsPage,
  DocsSectionTitle,
  DocsTitle,
} from "@/components/docs/content";
import { DocsSnippet } from "@/components/docs/snippet";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Start with Mocko docs for local development, self-hosting, and Mocko Cloud workflows.",
};

type UseCaseCard = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  cta: string;
  external?: boolean;
};

const useCases: UseCaseCard[] = [
  {
    title: "Local dev",
    description:
      "Run Mocko on your machine and create mocks from the UI or versioned files.",
    href: "/getting-started",
    icon: RocketIcon,
    cta: "Open local setup",
  },
  {
    title: "Self-hosted",
    description:
      "Deploy Mocko in Docker, Kubernetes, or a staging environment for team workflows and CI.",
    href: "/running/helm",
    icon: ServerIcon,
    cta: "See deployment guides",
  },
  {
    title: "Mocko Cloud",
    description:
      "Create public mock URLs, test webhooks, and skip local setup when you just need a hosted endpoint.",
    href: "https://app.mocko.dev",
    icon: CloudIcon,
    cta: "Open Mocko Cloud",
    external: true,
  },
] as const;

export default function DocsHomePage() {
  return (
    <DocsPage>
      <DocsEyebrow>Docs</DocsEyebrow>
      <DocsTitle>Everything you need to run Mocko</DocsTitle>
      <DocsLead>
        Create dynamic HTTP mocks, proxy the endpoints you are not replacing,
        and choose the workflow that fits: local dev, self-hosted, or Mocko
        Cloud.
      </DocsLead>

      {/* Snippet + CTA row */}
      <div className="mb-10 flex flex-wrap items-center gap-3">
        <DocsSnippet command="npm install -g @mocko/cli" />
        <Link
          href="/getting-started"
          className={buttonVariants({ variant: "default" })}
        >
          Get started
        </Link>
      </div>

      {/* Use-case cards */}
      <section className="mb-12 grid gap-3 md:grid-cols-3">
        {useCases.map(
          ({ title, description, href, icon: Icon, cta, external }) => {
            const linkProps = external
              ? { href, target: "_blank" as const, rel: "noreferrer noopener" }
              : { href };

            return (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-4 stroke-primary" aria-hidden />
                </div>
                <div>
                  <p className="mb-1 text-[13px] font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="text-[12px] leading-[1.65] text-muted-foreground">
                    {description}
                  </p>
                </div>
                <Link
                  {...linkProps}
                  className="mt-auto text-[12px] font-medium text-fg-2 transition-colors hover:text-foreground"
                >
                  {cta}
                </Link>
              </div>
            );
          },
        )}
      </section>

      {/* What is Mocko */}
      <section className="border-t border-border pt-8">
        <DocsSectionTitle>What is Mocko</DocsSectionTitle>
        <p className="max-w-[600px] text-[14px] leading-[1.85] text-fg-2">
          Mocko is a dynamic HTTP mocking tool that lets you define file mocks
          or create them through the UI, proxy unmatched requests to a real
          backend, and use flags to model stateful flows without building extra
          test infrastructure.
        </p>
      </section>
    </DocsPage>
  );
}
