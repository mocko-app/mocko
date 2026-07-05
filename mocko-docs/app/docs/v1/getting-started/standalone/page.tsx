import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/docs/callout";
import { LegacyBanner } from "@/components/docs/legacy-banner";
import {
  DocsCode,
  DocsCodeBlock,
  DocsH2,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Getting Started: Standalone Mode (v1)",
};

export default function V1StandalonePage() {
  return (
    <DocsPage>
      <LegacyBanner v2href="/docs/getting-started" />
      <DocsTitle>Getting Started with Standalone Mode</DocsTitle>

      <DocsH2>Installation</DocsH2>
      <Callout variant="warning">
        You need Node.js 14 or newer installed for this part. See{" "}
        <Link
          href="/docs/v1/updating-node"
          className="underline underline-offset-4"
        >
          Updating Node
        </Link>{" "}
        if needed.
      </Callout>
      <DocsP>Install the Mocko CLI with npm:</DocsP>
      <DocsCodeBlock>npm i -g @mocko/cli</DocsCodeBlock>
      <DocsP>
        On Linux or Mac you might need <DocsCode>sudo</DocsCode>:
      </DocsP>
      <DocsCodeBlock>sudo npm i -g @mocko/cli</DocsCodeBlock>
      <DocsP>Check the installation with the help flag:</DocsP>
      <DocsCodeBlock>{`$ mocko --help
Usage: mocko [options] <path to mocks folder>
Example: mocko -p 4000 mocks

Options:
  -h, --help       Shows this screen
  -v, --version    Shows the current version
  -w, --watch      Watches for file changes and restarts the server
  -p, --port       Port to serve the mocks (8080)
  -u, --url        URL to proxy requests when no mock is defined
  -t, --timeout    Max time to wait for a response from the proxied URL in millis (30000)`}</DocsCodeBlock>

      <DocsH2>Creating your first project</DocsH2>
      <DocsP>
        Create a folder with a <DocsCode>.hcl</DocsCode> file inside:
      </DocsP>
      <DocsCodeBlock>{`hello-mocko
└── first-mocks.hcl`}</DocsCodeBlock>
      <DocsP>
        In your <DocsCode>.hcl</DocsCode> file, create your first mock with the{" "}
        <DocsCode>mock</DocsCode> stanza:
      </DocsP>
      <DocsCodeBlock>{`mock "GET /hello" {
  body = "Hello from Mocko!"
}`}</DocsCodeBlock>
      <Callout variant="info">
        Your IDE or editor will most likely have an extension for{" "}
        <DocsCode>.hcl</DocsCode> syntax highlighting.
      </Callout>

      <DocsH2>Using Mocko</DocsH2>
      <DocsP>
        Inside your project folder, start Mocko with the watch flag:
      </DocsP>
      <DocsCodeBlock>mocko --watch ./</DocsCodeBlock>
      <DocsP>
        Your mocks are now served on port 8080. Use <DocsCode>--port</DocsCode>{" "}
        to change the port. The <DocsCode>--watch</DocsCode> flag auto-reloads
        changes to your mock files. Test it with curl:
      </DocsP>
      <DocsCodeBlock>{`$ curl http://localhost:8080/hello
Hello from Mocko!`}</DocsCodeBlock>

      <DocsH2>The mock stanza</DocsH2>
      <DocsP>
        You can define multiple mocks in a single file with status codes,
        headers, and multi-line bodies:
      </DocsP>
      <DocsCodeBlock>{`# Our first, simple, hello mock
mock "GET /hello" {
  body = "Hello from Mocko!"
}

# Mocking George, the cat
mock "GET /cats/george" {
  status = 200
  headers {
    Content-Type = "application/json"
  }
  body = <<EOF
  {
    "id": 1,
    "name": "George"
  }
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Method and path</DocsH2>
      <DocsP>
        Define the method and path right after the mock stanza. You can use{" "}
        <DocsCode>*</DocsCode> to match all methods. Specific paths take higher
        priority over generic ones: <DocsCode>/cats/george</DocsCode> always
        matches before <DocsCode>/cats/{"{name}"}</DocsCode>.
      </DocsP>

      <DocsH2>Parameters</DocsH2>
      <ul className="mb-4 list-disc space-y-1.5 pl-6 text-[14px] text-fg-2">
        <li>
          <DocsCode>status</DocsCode>: any value from 200–599; defaults to 201
          for POST, 200 otherwise
        </li>
        <li>
          <DocsCode>headers</DocsCode>: response headers map
        </li>
        <li>
          <DocsCode>delay</DocsCode>: delay in milliseconds before responding
        </li>
        <li>
          <DocsCode>body</DocsCode>: the response body, supports Handlebars
          templating
        </li>
      </ul>

      <DocsH2>Structuring your mocks</DocsH2>
      <DocsP>
        Mocks can be in nested folders at any depth. The folder structure is
        purely organizational and does not affect routing.
      </DocsP>
      <DocsCodeBlock>{`.
├── user
│   ├── homepage.hcl
│   └── profile.hcl
└── wallet
    ├── credit
    │   ├── credit.hcl
    │   └── indication.hcl
    └── refund.hcl`}</DocsCodeBlock>

      <DocsH2>Next steps</DocsH2>
      <DocsP>
        Now that you know how to define mocks, learn how to make them dynamic
        with{" "}
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
