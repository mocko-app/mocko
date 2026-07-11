import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/docs/callout";
import {
  DocsCode,
  DocsEyebrow,
  DocsH2,
  DocsLead,
  DocsPage,
  DocsP,
  DocsScreenshot,
  DocsTitle,
} from "@/components/docs/content";
import { DocsSnippet } from "@/components/docs/snippet";

export const metadata: Metadata = {
  title: "Getting Started",
  description:
    "Start Mocko locally with the UI-first quickstart and create your first mock in a few minutes.",
};

const nextSteps = [
  {
    title: "Move to file mocks",
    description:
      "Keep mocks with your project so they can be reviewed and versioned.",
    href: "/creating-mocks/file-mocks",
    cta: "Open guide",
  },
  {
    title: "Create from the UI",
    description:
      "Learn the control panel workflow for quick local experiments.",
    href: "/creating-mocks/ui-mocks",
    cta: "Open guide",
  },
  {
    title: "Use recipes",
    description: "Copy patterns for state, proxying, fixtures, and failures.",
    href: "/recipes",
    cta: "Open guide",
  },
  {
    title: "Set up your coding agent",
    description:
      "Install the Mocko skill so your agent can write and debug mocks.",
    href: "/coding-agents",
    cta: "Open guide",
  },
] as const;

export default function GettingStartedPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Getting Started</DocsEyebrow>
      <DocsTitle>Your first mock in 5 minutes</DocsTitle>
      <DocsLead>
        No config files needed. You will install the CLI, open the UI, create a
        mock, and hit it with a real HTTP request.
      </DocsLead>

      {/* Step 1 */}
      <DocsH2>1. Install the CLI</DocsH2>
      <DocsP>
        You need Node.js 20.19 or newer. Install the CLI globally with npm:
      </DocsP>
      <DocsSnippet command="npm install -g @mocko/cli" className="mb-4" />

      {/* Step 2 */}
      <DocsH2>2. Start Mocko</DocsH2>
      <DocsSnippet command="mocko" className="mb-4" />
      <DocsP>
        A folder argument is optional. Use <DocsCode>mocko ./</DocsCode> if you
        also want to load file mocks from the current directory. Without a
        folder, Mocko starts with no pre-loaded file mocks.
      </DocsP>
      <Callout variant="warning">
        Mocks created in the UI are <strong>temporary</strong>: they reset when
        Mocko stops unless you run with Redis. For repeatable project behavior,
        move mocks into files with{" "}
        <Link
          href="/creating-mocks/file-mocks"
          className="underline underline-offset-4"
        >
          file mocks
        </Link>
        .
      </Callout>

      {/* Step 3 */}
      <DocsH2>3. Open the UI</DocsH2>
      <DocsP>
        Mocko opens at <DocsCode>http://localhost:6625</DocsCode>. Click{" "}
        <strong className="text-foreground">New mock</strong> and fill in:
      </DocsP>
      <ul className="mb-4 space-y-1.5 text-[14px] text-fg-2">
        <li>
          Method: <DocsCode>GET</DocsCode>
        </li>
        <li>
          Path: <DocsCode>/hello</DocsCode>
        </li>
        <li>
          Response body: <DocsCode>Hello from Mocko!</DocsCode>
        </li>
      </ul>
      <DocsScreenshot
        src="https://cdn.codetunnel.net/mocko/getting-started-create-mock.png"
        alt="Mocko control panel with the new mock form filled in: method GET, path /hello, and a plain text response body"
      />

      {/* Step 4 */}
      <DocsH2>4. Test it</DocsH2>
      <DocsSnippet
        command="curl http://localhost:8080/hello"
        output="Hello from Mocko!"
        className="mb-4"
      />

      <DocsH2>5. Move repeatable mocks to files</DocsH2>
      <DocsP>
        The UI is ideal for quick experiments. Once a mock becomes part of your
        development workflow, define it as a file mock so it can live with your
        project, run in CI, and be reviewed like any other change.
      </DocsP>
      <Callout variant="info">
        If you work with a coding agent, it can write the files for you: install
        the Mocko skill from{" "}
        <Link href="/coding-agents" className="underline underline-offset-4">
          Coding Agents
        </Link>
        .
      </Callout>

      {/* What's next */}
      <DocsH2>{"What's next?"}</DocsH2>
      <div className="grid gap-3 md:grid-cols-2">
        {nextSteps.map(({ title, description, href, cta }) => (
          <div
            key={href}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div>
              <p className="mb-1 text-[13px] font-semibold text-foreground">
                {title}
              </p>
              <p className="text-[12px] leading-[1.65] text-muted-foreground">
                {description}
              </p>
            </div>
            <Link
              href={href}
              className="mt-auto text-[12px] font-medium text-fg-2 transition-colors hover:text-foreground"
            >
              {cta}
            </Link>
          </div>
        ))}
      </div>
    </DocsPage>
  );
}
