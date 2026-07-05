import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/docs/callout";
import {
  DocsCode,
  DocsCodeBlock,
  DocsEyebrow,
  DocsH2,
  DocsLead,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "File Mocks",
  description:
    "Create Mocko mocks from versioned files with routes, response bodies, headers, delays, labels, and host scoping.",
};

export default function FileMocksPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>File Mocks</DocsTitle>
      <DocsLead>
        File mocks are the recommended workflow when mocks should live with a
        project, be reviewed, and run the same way for every developer.
      </DocsLead>

      <DocsH2>Create a mock file</DocsH2>
      <DocsP>
        Put one or more <DocsCode>.hcl</DocsCode> files in a folder and point
        the CLI at that folder.
      </DocsP>
      <DocsCodeBlock>{`mocks/
  users.hcl`}</DocsCodeBlock>
      <DocsCodeBlock>{`mock "GET /users/{id}" {
  status = 200
  headers {
    Content-Type = "application/json"
  }
  body = <<-EOF
    {
      "id": {{request.params.id}},
      "name": "Alice"
    }
  EOF
}`}</DocsCodeBlock>
      <DocsCodeBlock>mocko --watch mocks</DocsCodeBlock>

      <DocsH2>Route and response fields</DocsH2>
      <ul className="mb-4 space-y-1.5 text-[14px] leading-7 text-fg-2">
        <li>
          <DocsCode>mock &quot;METHOD /path/{`{param}`}&quot;</DocsCode> defines
          the method and route.
        </li>
        <li>
          <DocsCode>status</DocsCode> sets the response code. It defaults to{" "}
          <DocsCode>201</DocsCode> for <DocsCode>POST</DocsCode> and{" "}
          <DocsCode>200</DocsCode> for other methods.
        </li>
        <li>
          <DocsCode>headers</DocsCode> sets response headers.
        </li>
        <li>
          <DocsCode>body</DocsCode> is a Bigodon template string.
        </li>
        <li>
          <DocsCode>delay</DocsCode> waits before responding, in milliseconds.
        </li>
        <li>
          <DocsCode>enabled = false</DocsCode> disables a mock without deleting
          it.
        </li>
        <li>
          <DocsCode>labels</DocsCode> adds tags shown in the UI.
        </li>
        <li>
          <DocsCode>host</DocsCode> scopes a mock to a host definition.
        </li>
      </ul>

      <Callout variant="tip">
        Use file mocks for behavior that should be committed with your app. Use
        the UI for quick experiments and one-off changes.
      </Callout>

      <DocsH2>Organize files freely</DocsH2>
      <DocsP>
        Nested folders are organizational only. Mocko loads every{" "}
        <DocsCode>.hcl</DocsCode> file below the folder you pass to the CLI and
        merges mocks, data, and hosts together.
      </DocsP>
      <DocsCodeBlock>{`mocks/
  users/
    profile.hcl
  catalog/
    products.hcl
  shared/
    data.hcl`}</DocsCodeBlock>

      <DocsH2>Next steps</DocsH2>
      <DocsP>
        Make responses dynamic with{" "}
        <Link
          href="/docs/creating-mocks/templating"
          className="underline underline-offset-4 hover:text-foreground"
        >
          templating
        </Link>
        , share fixtures with{" "}
        <Link
          href="/docs/creating-mocks/data-blocks"
          className="underline underline-offset-4 hover:text-foreground"
        >
          data blocks
        </Link>
        , or put Mocko in front of real services with{" "}
        <Link
          href="/docs/creating-mocks/proxying-and-hosts"
          className="underline underline-offset-4 hover:text-foreground"
        >
          proxying and hosts
        </Link>
        .
      </DocsP>
    </DocsPage>
  );
}
