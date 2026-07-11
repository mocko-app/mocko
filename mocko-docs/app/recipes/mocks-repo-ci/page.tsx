import type { Metadata } from "next";
import { Callout } from "@/components/docs/callout";
import {
  DocsCode,
  DocsCodeBlock,
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
  title: "Validate Mocks in CI",
  description:
    "Keep a team's mocks in a dedicated repository, validate every pull request with mocko validate, and ship them as a Docker image.",
};

export default function MocksRepoCiPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Recipes</DocsEyebrow>
      <DocsTitle>Validate Mocks in CI</DocsTitle>
      <DocsLead>
        When a team shares mocks, a broken HCL file or a duplicated route should
        never reach the running server. This recipe keeps the mocks in a
        dedicated repository, validates every pull request with{" "}
        <DocsCode>mocko validate</DocsCode>, and packages the approved mocks as
        a Docker image ready to deploy.
      </DocsLead>

      <DocsH2>The mocks repository</DocsH2>
      <DocsP>
        The whole repository is a mocks folder, a Dockerfile, and a workflow:
      </DocsP>
      <DocsCodeBlock language="text">{`my-team-mocks/
├── mocks/
│   ├── users.hcl
│   ├── orders.hcl
│   └── payments/
│       └── refunds.hcl
├── Dockerfile
└── .github/
    └── workflows/
        └── validate.yaml`}</DocsCodeBlock>

      <DocsH2>Validating pull requests</DocsH2>
      <DocsP>
        <DocsCode>mocko validate</DocsCode> checks the folder without starting a
        server and exits non-zero when a mock is broken, so wiring it into CI is
        one step:
      </DocsP>
      <DocsCodeBlock language="yaml">{`name: Validate mocks
on:
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx --yes @mocko/cli@latest validate mocks --strict`}</DocsCodeBlock>
      <DocsP>
        The report groups problems by file and explains how to fix each one, so
        a failing check reads like a code review comment. The workflow runs with{" "}
        <DocsCode>--strict</DocsCode>, so warnings also fail the check, like
        paths that look like Express-style <DocsCode>:param</DocsCode>{" "}
        parameters; drop the flag if you only want hard errors to block a merge.
        The full list of checks is in the{" "}
        <DocsLink href="/reference/cli">CLI reference</DocsLink>.
      </DocsP>
      <DocsP>You can run the same command locally before pushing:</DocsP>
      <DocsSnippet command="npx @mocko/cli@latest validate mocks" />

      <DocsH2>Shipping the mocks as an image</DocsH2>
      <DocsP>
        With validation gating merges, the main branch is always deployable.
        Bake the mocks into an image on top of the official ones. For a{" "}
        <DocsLink href="/running/helm">
          Kubernetes deployment with Helm
        </DocsLink>
        , build on the core image:
      </DocsP>
      <DocsCodeBlock language="dockerfile">{`FROM ghcr.io/mocko-app/core:2
COPY mocks/ /var/mocks/`}</DocsCodeBlock>
      <DocsP>
        For <DocsLink href="/running/compose">Docker Compose</DocsLink>, the
        standalone image also bundles the control panel UI:
      </DocsP>
      <DocsCodeBlock language="dockerfile">{`FROM ghcr.io/mocko-app/standalone:2
COPY mocks/ /var/mocks/`}</DocsCodeBlock>
      <Callout variant="info">
        Pin the base image to the <DocsCode>:2</DocsCode> tag and install the
        CLI with <DocsCode>@latest</DocsCode>. Both track the current major
        version, so the validator in CI always matches the server the mocks will
        run on.
      </Callout>

      <DocsH2>Why not validate at startup?</DocsH2>
      <DocsP>
        The running server is deliberately forgiving: a broken file is skipped
        with a warning so one bad mock never takes down the rest. That is the
        right behavior in development, but in a shared repository it hides
        mistakes. <DocsCode>mocko validate</DocsCode> applies the strict
        interpretation of the same rules:
      </DocsP>
      <DocsUl>
        <li>
          HCL files that fail to parse fail validation instead of being ignored
        </li>
        <li>
          Mocks with invalid definitions or duplicated routes fail instead of
          being skipped
        </li>
        <li>
          Template bodies that fail to compile fail instead of responding 500 at
          runtime
        </li>
      </DocsUl>
    </DocsPage>
  );
}
