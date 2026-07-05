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
  DocsTable,
  DocsTbody,
  DocsTd,
  DocsTh,
  DocsThead,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Template Helpers",
  description:
    "Reference for Mocko's own template helpers: setStatus, setHeader, proxy, log, and the flag helpers, plus the request context.",
};

export default function ReferenceHelpersPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Reference</DocsEyebrow>
      <DocsTitle>Template Helpers</DocsTitle>
      <DocsLead>
        The helpers Mocko adds on top of the Bigodon language, available in
        every mock body. Language-level helpers (strings, math, arrays,
        comparisons, dates) are in the{" "}
        <DocsLink href="/reference/bigodon">Bigodon reference</DocsLink>.
      </DocsLead>

      <DocsH2>Response helpers</DocsH2>
      <DocsP>
        These render as an empty string; they change the response without adding
        content to the body.
      </DocsP>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Helper</DocsTh>
            <DocsTh>Signature</DocsTh>
            <DocsTh>Description</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>setStatus</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>{"{{setStatus 404}}"}</DocsCode>
            </DocsTd>
            <DocsTd>
              Override the response status for this request. Accepts a number or
              numeric string.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>setHeader</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>{"{{setHeader 'name' 'value'}}"}</DocsCode>
            </DocsTd>
            <DocsTd>
              Add or override a response header. Case-insensitive; merges with
              the mock&apos;s <DocsCode>headers</DocsCode> block.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>proxy</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>{"{{proxy}}"}</DocsCode>
            </DocsTd>
            <DocsTd>
              Forward the request and use the upstream response as the entire
              response. Halts template execution. See variants below.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>log</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>{"{{log 'message'}}"}</DocsCode>
            </DocsTd>
            <DocsTd>
              Print to the server console. <DocsCode>warn</DocsCode> and{" "}
              <DocsCode>error</DocsCode> work the same at their log levels;
              objects are JSON-stringified.
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>

      <DocsH2>proxy variants</DocsH2>
      <DocsCodeBlock>{`{{proxy}}                                    {{! default backend (-u / PROXY_BASE-URI) }}
{{proxy 'https://demo-api.mockoapp.net'}}    {{! URL used as base; request path appended }}
{{proxy 'billing'}}                          {{! destination of the named host block }}`}</DocsCodeBlock>
      <DocsP>
        The argument is a base: <DocsCode>GET /users/42</DocsCode> through{" "}
        <DocsCode>{"{{proxy 'https://demo-api.mockoapp.net'}}"}</DocsCode>{" "}
        requests <DocsCode>https://demo-api.mockoapp.net/users/42</DocsCode>.
        Method, headers, query string, and body are forwarded unchanged.
      </DocsP>

      <DocsH2>Flag helpers</DocsH2>
      <DocsP>
        Flags are key-value state shared by all mocks and persisted according to
        the <DocsLink href="/running/persistence">storage mode</DocsLink>. The
        guided introduction is on{" "}
        <DocsLink href="/creating-mocks/flags">Flags</DocsLink>.
      </DocsP>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Helper</DocsTh>
            <DocsTh>Signature</DocsTh>
            <DocsTh>Description</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>setFlag</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>{"{{setFlag 'key' value [ttlMs]}}"}</DocsCode>
            </DocsTd>
            <DocsTd>
              Store a value (any JSON-serializable type). Optional TTL in
              milliseconds. Renders nothing.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>getFlag</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>{"{{getFlag 'key'}}"}</DocsCode>
            </DocsTd>
            <DocsTd>
              Read a value; renders empty for unset keys. Render stored objects
              with <DocsCode>{"{{json (getFlag 'key')}}"}</DocsCode>.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>hasFlag</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>{"{{#hasFlag 'key'}}...{{/hasFlag}}"}</DocsCode>
            </DocsTd>
            <DocsTd>True when the key exists; made for block position.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>delFlag</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>{"{{delFlag 'key'}}"}</DocsCode>
            </DocsTd>
            <DocsTd>Delete a key. Renders nothing.</DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>
      <Callout variant="info">
        Keys containing <DocsCode>:</DocsCode> display as nested folders in the
        UI. Build dynamic keys with{" "}
        <DocsCode>{"{{= $key (append 'users:' request.params.id)}}"}</DocsCode>.
      </Callout>

      <DocsH2>The request context</DocsH2>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Path</DocsTh>
            <DocsTh>Contents</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>request.params.&lt;name&gt;</DocsCode>
            </DocsTd>
            <DocsTd>
              Path parameters from <DocsCode>{"{name}"}</DocsCode> segments in
              the route. Always strings.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>request.query.&lt;name&gt;</DocsCode>
            </DocsTd>
            <DocsTd>Query string parameters. Always strings.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>request.headers.&lt;name&gt;</DocsCode>
            </DocsTd>
            <DocsTd>
              Request headers, keyed lowercase regardless of how they were sent.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>request.body.&lt;field&gt;</DocsCode>
            </DocsTd>
            <DocsTd>
              Parsed JSON or form body fields (unless the mock sets{" "}
              <DocsCode>parse = false</DocsCode>).
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>data.&lt;block&gt;.&lt;key&gt;</DocsCode>
            </DocsTd>
            <DocsTd>
              Values from{" "}
              <DocsLink href="/creating-mocks/data-blocks">
                data blocks
              </DocsLink>
              .
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>
      <Callout variant="warning">
        Inside context-changing blocks like <DocsCode>forEach</DocsCode>,{" "}
        <DocsCode>request</DocsCode> and <DocsCode>data</DocsCode> are out of
        scope. Extract values to variables first or reach back with{" "}
        <DocsCode>$root</DocsCode>; see{" "}
        <DocsLink href="/creating-mocks/templating">Templating</DocsLink>.
      </Callout>
    </DocsPage>
  );
}
