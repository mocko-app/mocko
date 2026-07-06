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
  title: "CLI",
  description:
    "Run Mocko locally with the CLI: installation, watch mode, ports, proxying, UI options, and Redis mode.",
};

export default function RunningCliPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Running Mocko</DocsEyebrow>
      <DocsTitle>CLI</DocsTitle>
      <DocsLead>
        The CLI is how Mocko runs on your machine: one command that serves your
        mocks, watches your files, and hosts the control panel. This page covers
        every option, from ports to proxying to Redis mode.
      </DocsLead>

      <DocsH2>Install</DocsH2>
      <DocsP>
        The CLI requires Node.js 20.19 or newer and is installed globally from
        npm:
      </DocsP>
      <DocsSnippet command="npm install -g @mocko/cli" className="mb-4" />
      <DocsP>
        On an older Node version the CLI refuses to start and points you to the
        update instructions, so there is no way to end up on a broken install
        silently.
      </DocsP>

      <DocsH2>Everyday usage</DocsH2>
      <DocsP>
        Point the CLI at a folder of <DocsCode>.hcl</DocsCode> files, usually
        with watch mode on so edits apply immediately:
      </DocsP>
      <DocsSnippet command="mocko --watch mocks" className="mb-4" />
      <DocsP>
        Mocks are served on <DocsCode>http://localhost:8080</DocsCode> and the
        control panel on <DocsCode>http://localhost:6625</DocsCode>. Both the
        folder and the flags are optional: a bare <DocsCode>mocko</DocsCode>{" "}
        starts an empty instance you can drive entirely from the UI, which is
        how the <DocsLink href="/getting-started">quickstart</DocsLink> runs it.
      </DocsP>

      <DocsH2>Ports</DocsH2>
      <DocsP>
        <DocsCode>-p</DocsCode> moves the mock server, <DocsCode>-P</DocsCode>{" "}
        moves the UI:
      </DocsP>
      <DocsSnippet
        command="mocko -p 4000 -P 4625 --watch mocks"
        className="mb-4"
      />
      <DocsP>
        A common reason to move the mock port: running Mocko in place of the
        service your frontend already points at, so no client configuration
        changes at all.
      </DocsP>

      <DocsH2>Proxying to a real backend</DocsH2>
      <DocsP>
        <DocsCode>-u</DocsCode> sets the proxy target for requests no mock
        matches, turning Mocko into a selective layer in front of a real API:
      </DocsP>
      <DocsSnippet
        command="mocko -u https://demo-api.mockoapp.net --watch mocks"
        className="mb-4"
      />
      <DocsP>
        Proxied requests time out after 30 seconds by default;{" "}
        <DocsCode>-t</DocsCode> changes that in milliseconds. The mock-side
        behavior of proxying is covered in{" "}
        <DocsLink href="/creating-mocks/proxying-and-hosts">
          Proxying and Hosts
        </DocsLink>
        .
      </DocsP>

      <DocsH2>Running without the UI</DocsH2>
      <DocsP>
        The control panel is on by default. <DocsCode>--no-ui</DocsCode> turns
        it off, which fits CI jobs and scripted environments where nobody will
        open a browser:
      </DocsP>
      <DocsSnippet command="mocko --no-ui --watch mocks" className="mb-4" />

      <DocsH2>Redis mode</DocsH2>
      <DocsP>
        By default the CLI runs storeless: mocks created in the UI, hosts, and
        flags all live in memory and reset when the process stops.{" "}
        <DocsCode>-r</DocsCode> connects Mocko to a Redis instance and makes
        that state durable:
      </DocsP>
      <DocsSnippet
        command="mocko -r redis://localhost:6379 --watch mocks"
        className="mb-4"
      />
      <Callout variant="info">
        Storeless is a feature for local work: every session starts clean. Reach
        for Redis when state should survive restarts or be shared. The full
        breakdown of what lives where is on{" "}
        <DocsLink href="/running/persistence">Persistence and Redis</DocsLink>.
      </Callout>

      <DocsH2>All options</DocsH2>
      <DocsCodeBlock language="text">{`Usage: mocko [options] [path to mocks folder]
Example: mocko -p 4000 mocks

  -h, --help       Shows this screen
  -v, --version    Shows the current version
  -w, --watch      Watches for file changes and restarts the server
  -p, --port       Port to serve the mocks (8080)
  -u, --url        URL to proxy requests when no mock is defined
  -t, --timeout    Max time to wait for a proxied response in millis (30000)
  --no-ui          Disables the control panel UI
  -r, --redis      Enables Redis mode using the provided Redis URL
  -P, --ui-port    Overrides the UI port (default: 6625)`}</DocsCodeBlock>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          The CLI wires the control panel to the mock server automatically,
          generating a fresh internal secret on every run. There is nothing to
          configure or protect on localhost.
        </li>
        <li>
          Without a mocks folder argument, file mocks are simply disabled for
          that session; the CLI prints a note so it is never a surprise.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        To run Mocko alongside the rest of your local stack instead of as a
        global CLI, continue to{" "}
        <DocsLink href="/running/compose">Docker Compose</DocsLink>.
      </DocsP>
    </DocsPage>
  );
}
