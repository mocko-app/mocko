import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/docs/callout";
import { LegacyBanner } from "@/components/docs/legacy-banner";
import {
  DocsCodeBlock,
  DocsH2,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Getting Started: Complete Stack (v1)",
};

export default function V1CompletePage() {
  return (
    <DocsPage>
      <LegacyBanner v2href="/docs/getting-started" />
      <DocsTitle>Getting Started with Complete Stack</DocsTitle>

      <DocsH2>Installation</DocsH2>
      <Callout variant="warning">
        You need Docker and docker-compose for this installation.
      </Callout>
      <DocsP>Clone the Mocko repository and enter it:</DocsP>
      <DocsCodeBlock>{`git clone https://github.com/mocko-app/mocko.git
cd mocko`}</DocsCodeBlock>
      <DocsP>
        Start the stack. On Linux or Mac you may need{" "}
        <code className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[13px] text-foreground">
          sudo
        </code>{" "}
        if you are not in the{" "}
        <code className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[13px] text-foreground">
          docker
        </code>{" "}
        group:
      </DocsP>
      <DocsCodeBlock>docker-compose up</DocsCodeBlock>
      <DocsP>
        That&apos;s it. Access{" "}
        <code className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[13px] text-foreground">
          http://localhost:8080
        </code>{" "}
        to use the UI. Your mocks are served on{" "}
        <code className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[13px] text-foreground">
          localhost:8081
        </code>
        .
      </DocsP>

      <DocsH2>Next steps</DocsH2>
      <DocsP>
        Now that Mocko is up and running, learn the main functionality with{" "}
        <Link
          href="/docs/v1/templating"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Templating
        </Link>
        .
      </DocsP>
    </DocsPage>
  );
}
