import type { Metadata } from "next";
import Link from "next/link";
import { LegacyBanner } from "@/components/docs/legacy-banner";
import { DocsH2, DocsP, DocsPage, DocsTitle } from "@/components/docs/content";

export const metadata: Metadata = { title: "Mocko v1 Overview" };

export default function V1OverviewPage() {
  return (
    <DocsPage>
      <LegacyBanner />
      <DocsTitle>Mocko</DocsTitle>
      <DocsP>
        Mocking made easy: create dynamic mocks, proxy your API, and choose
        which endpoints to mock.
      </DocsP>

      <DocsH2>Getting started: CLI</DocsH2>
      <DocsP>Use the CLI if you want to:</DocsP>
      <ul className="mb-4 list-disc space-y-1.5 pl-6 text-[14px] text-fg-2">
        <li>
          Manage mocks in configuration files, structured and versioned in
          folders
        </li>
        <li>Mock integrations for automated tests</li>
        <li>Run it anywhere with a command and no dependencies</li>
      </ul>
      <DocsP>
        <Link
          href="/v1/getting-started/standalone"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Get started with Standalone Mode →
        </Link>
      </DocsP>

      <DocsH2>Getting started: UI</DocsH2>
      <DocsP>Use the complete stack if you want to:</DocsP>
      <ul className="mb-4 list-disc space-y-1.5 pl-6 text-[14px] text-fg-2">
        <li>Manage mocks in a web UI with no configuration or CLIs needed</li>
        <li>Mock scenarios in staging environments on the fly</li>
        <li>Mock integrations in your development environment</li>
      </ul>
      <DocsP>
        <Link
          href="/v1/getting-started/complete"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Get started with the Complete Stack →
        </Link>
      </DocsP>

      <DocsH2>Getting started: SaaS</DocsH2>
      <DocsP>Use Mocko Cloud if you want to:</DocsP>
      <ul className="mb-4 list-disc space-y-1.5 pl-6 text-[14px] text-fg-2">
        <li>Create mocks available everywhere, in the cloud</li>
        <li>No installation or configuration required</li>
        <li>Manage mocks in a web UI</li>
      </ul>
      <DocsP>
        <a
          href="https://app.mocko.dev/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Login with GitHub to Mocko Cloud ↗
        </a>
      </DocsP>

      <DocsH2>Features</DocsH2>
      <ul className="mb-4 list-disc space-y-1.5 pl-6 text-[14px] text-fg-2">
        <li>
          Choose how to manage mocks: web UI for speed, HCL files for versioning
        </li>
        <li>
          Proxy your real API: requests pass through unless a mock matches
        </li>
        <li>Create dynamic mocks using Handlebars templating</li>
        <li>Easy to deploy in containers or via CLI</li>
        <li>
          Really, <strong className="text-foreground">really</strong> fast
        </li>
      </ul>
    </DocsPage>
  );
}
