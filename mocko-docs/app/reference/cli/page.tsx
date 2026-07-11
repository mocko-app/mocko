import type { Metadata } from "next";
import {
  DocsCode,
  DocsCodeBlock,
  DocsEyebrow,
  DocsH2,
  DocsLead,
  DocsLink,
  DocsP,
  DocsPage,
  DocsTable,
  DocsTbody,
  DocsTd,
  DocsTh,
  DocsThead,
  DocsTitle,
  DocsUl,
} from "@/components/docs/content";
import { DocsSnippet } from "@/components/docs/snippet";

export const metadata: Metadata = {
  title: "CLI Reference",
  description:
    "Complete reference for the mocko command: every flag, defaults, and usage examples.",
};

export default function ReferenceCliPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Reference</DocsEyebrow>
      <DocsTitle>CLI</DocsTitle>
      <DocsLead>
        Complete reference for the <DocsCode>mocko</DocsCode> command. For a
        guided tour of the same options, see{" "}
        <DocsLink href="/running/cli">Running Mocko: CLI</DocsLink>.
      </DocsLead>

      <DocsH2>Usage</DocsH2>
      <DocsCodeBlock language="bash">{`mocko [options] [path to mocks folder]
mocko validate [options] <path to mocks folder>`}</DocsCodeBlock>
      <DocsP>
        The mocks folder is optional; without it, file mocks are disabled for
        the session. Requires Node.js 20.19 or newer, installed with{" "}
        <DocsCode>npm install -g @mocko/cli</DocsCode>.
      </DocsP>

      <DocsH2>Options</DocsH2>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Flag</DocsTh>
            <DocsTh>Default</DocsTh>
            <DocsTh>Description</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>-h</DocsCode>, <DocsCode>--help</DocsCode>
            </DocsTd>
            <DocsTd></DocsTd>
            <DocsTd>Show usage help.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>-v</DocsCode>, <DocsCode>--version</DocsCode>
            </DocsTd>
            <DocsTd></DocsTd>
            <DocsTd>Show the installed version.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>-w</DocsCode>, <DocsCode>--watch</DocsCode>
            </DocsTd>
            <DocsTd>off</DocsTd>
            <DocsTd>Watch the mocks folder and reload on file changes.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>-p</DocsCode>, <DocsCode>--port</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>8080</DocsCode>
            </DocsTd>
            <DocsTd>Port for the mock server.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>-u</DocsCode>, <DocsCode>--url</DocsCode>
            </DocsTd>
            <DocsTd>unset</DocsTd>
            <DocsTd>
              Proxy target for requests no mock matches. Unset means unmatched
              requests return 404.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>-t</DocsCode>, <DocsCode>--timeout</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>30000</DocsCode>
            </DocsTd>
            <DocsTd>Max milliseconds to wait for a proxied response.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>--no-ui</DocsCode>
            </DocsTd>
            <DocsTd>UI on</DocsTd>
            <DocsTd>Disable the control panel.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>-r</DocsCode>, <DocsCode>--redis</DocsCode>
            </DocsTd>
            <DocsTd>unset</DocsTd>
            <DocsTd>
              Redis URL enabling{" "}
              <DocsLink href="/running/persistence">Redis mode</DocsLink>, e.g.{" "}
              <DocsCode>redis://localhost:6379</DocsCode>.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>-P</DocsCode>, <DocsCode>--ui-port</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>6625</DocsCode>
            </DocsTd>
            <DocsTd>Port for the control panel.</DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>

      <DocsH2>mocko validate</DocsH2>
      <DocsCodeBlock language="bash">{`mocko validate [options] <path to mocks folder>`}</DocsCodeBlock>
      <DocsP>
        Checks every mock in the folder and exits with code{" "}
        <DocsCode>1</DocsCode> if any of them is broken, without starting a
        server. Problems that are only warnings when the server starts fail
        validation, which makes it a good gate for CI. See{" "}
        <DocsLink href="/recipes/mocks-repo-ci">Validate Mocks in CI</DocsLink>{" "}
        for a complete pipeline.
      </DocsP>
      <DocsP>Validation fails on:</DocsP>
      <DocsUl>
        <li>HCL files that fail to parse (these are ignored at startup)</li>
        <li>
          Invalid mock or host definitions: unknown methods, invalid status
          codes, conflicting <DocsCode>format</DocsCode> and Content-Type, and
          similar
        </li>
        <li>
          Routes that fail to map, such as two mocks on the same method and path
          or query parameters in the path
        </li>
        <li>
          Template bodies that fail to compile (these mocks respond 500 to every
          request)
        </li>
        <li>
          Mocks on the reserved <DocsCode>/__mocko__</DocsCode> path
        </li>
        <li>Folders with no mocks at all</li>
      </DocsUl>
      <DocsP>
        Suspicious but valid definitions produce warnings instead: paths with
        Express-style <DocsCode>:param</DocsCode> parameters,{" "}
        <DocsCode>*</DocsCode> wildcards, or <DocsCode>{"${param}"}</DocsCode>{" "}
        placeholders, and mocks referencing a <DocsCode>host</DocsCode> that no
        host block defines. Warnings do not fail validation unless{" "}
        <DocsCode>--strict</DocsCode> is set.
      </DocsP>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Flag</DocsTh>
            <DocsTh>Default</DocsTh>
            <DocsTh>Description</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>-h</DocsCode>, <DocsCode>--help</DocsCode>
            </DocsTd>
            <DocsTd></DocsTd>
            <DocsTd>Show usage help.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>-s</DocsCode>, <DocsCode>--strict</DocsCode>
            </DocsTd>
            <DocsTd>off</DocsTd>
            <DocsTd>Treat warnings as errors.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>-j</DocsCode>, <DocsCode>--json</DocsCode>
            </DocsTd>
            <DocsTd>off</DocsTd>
            <DocsTd>
              Print a machine-readable JSON report instead of the human output.
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>
      <DocsP>
        Exit code <DocsCode>0</DocsCode> means the folder is valid, anything
        else means it is not: validation errors, warnings under{" "}
        <DocsCode>--strict</DocsCode>, or a folder that does not exist.
      </DocsP>

      <DocsH2>Examples</DocsH2>
      <DocsSnippet command="mocko --watch mocks" className="mb-4" />
      <DocsSnippet
        command="mocko -p 4000 -u https://demo-api.mockoapp.net --watch mocks"
        className="mb-4"
      />
      <DocsSnippet
        command="mocko --no-ui -r redis://localhost:6379 mocks"
        className="mb-4"
      />

      <DocsH2>Notes</DocsH2>
      <DocsUl>
        <li>
          The UI is enabled by default; the CLI generates a fresh internal
          secret per run to connect it to the mock server.
        </li>
        <li>
          Hidden files and folders (names starting with a dot) inside the mocks
          folder are ignored.
        </li>
        <li>
          On unsupported Node versions the CLI exits with a link to the update
          instructions instead of failing later at runtime.
        </li>
      </DocsUl>
    </DocsPage>
  );
}
