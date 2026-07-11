import type { Metadata } from "next";
import { Callout } from "@/components/docs/callout";
import {
  DocsCode,
  DocsEyebrow,
  DocsH2,
  DocsLead,
  DocsLink,
  DocsP,
  DocsPage,
  DocsTitle,
  DocsUl,
} from "@/components/docs/content";
import { DocsSnippet } from "@/components/docs/snippet";

export const metadata: Metadata = {
  title: "Coding Agents",
  description:
    "Install the Mocko skill so coding agents like Claude Code, Codex, and Cursor can write, debug, and review your mocks.",
};

export default function CodingAgentsPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Getting Started</DocsEyebrow>
      <DocsTitle>Mocking with coding agents</DocsTitle>
      <DocsLead>
        Mocko ships an agent skill that teaches coding agents the mock file
        format, the Bigodon templating language, and the SDK. With it installed,
        your agent can write mocks for your API, debug failing templates, and
        review mock changes in pull requests.
      </DocsLead>

      <DocsH2>Install the skill</DocsH2>
      <DocsP>
        The skill is distributed with{" "}
        <DocsLink href="https://skills.sh">skills.sh</DocsLink>, which works
        with Claude Code, Codex, Cursor, and other skills-compatible agents. Run
        this in your project:
      </DocsP>
      <DocsSnippet
        command="npx skills@latest add mocko-app/mocko/skills/mocko"
        className="mb-4"
      />
      <DocsP>
        The command copies the skill into your repository. Commit it like any
        other file: teammates and CI agents pick it up on checkout, and the
        version you reviewed is the version your agents use. Re-run the same
        command to update it.
      </DocsP>

      <DocsH2>What the skill covers</DocsH2>
      <DocsUl>
        <li>
          Mock file structure: <DocsCode>mock</DocsCode> blocks, matching,
          status, delay, headers, and labels.
        </li>
        <li>
          Bigodon templating: the request context, helpers, conditionals, loops,
          and variables, including the differences from Handlebars.
        </li>
        <li>
          Flags, data blocks, host blocks, and proxying, so it can build
          stateful and multi-service setups.
        </li>
        <li>
          The <DocsCode>@mocko/sdk</DocsCode> client for reading and writing
          flags from automated tests.
        </li>
        <li>Translating v1 Handlebars templates to v2 Bigodon.</li>
      </DocsUl>

      <DocsH2>What to ask for</DocsH2>
      <DocsP>
        The skill makes the agent precise about syntax, but the workflow is
        ordinary prompting. Some requests that work well:
      </DocsP>
      <DocsUl>
        <li>
          Paste a real response from your backend, or a snippet of its OpenAPI
          spec, and ask for a mock that mimics it. Point the agent at a{" "}
          <DocsLink href="/recipes">recipe</DocsLink> when you want a specific
          pattern, like stateful CRUD or a polling flow.
        </li>
        <li>
          Paste a template along with the wrong output it produced and ask the
          agent to find the bug. The skill covers the debugging signals from{" "}
          <DocsLink href="/creating-mocks/templating">Templating</DocsLink>,
          such as context mistakes and broken JSON.
        </li>
        <li>
          Ask it to review the mock files in a pull request, checking matching
          overlaps and template correctness.
        </li>
        <li>
          During a{" "}
          <DocsLink href="/reference/v1-migration">v1 migration</DocsLink>, hand
          it the templates flagged as invalid and ask for Bigodon translations.
        </li>
      </DocsUl>

      <Callout variant="info">
        The skill tracks the latest Mocko release. If you run an older version,
        mention it in your prompt so the agent avoids features your install does
        not have yet.
      </Callout>

      <DocsH2>Next</DocsH2>
      <DocsP>
        To judge what the agent writes, you want the fundamentals yourself:
        start with{" "}
        <DocsLink href="/creating-mocks/file-mocks">File Mocks</DocsLink> and{" "}
        <DocsLink href="/creating-mocks/templating">Templating</DocsLink>.
      </DocsP>
    </DocsPage>
  );
}
