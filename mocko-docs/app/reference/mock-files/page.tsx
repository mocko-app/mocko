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

export const metadata: Metadata = {
  title: "Mock Files (HCL)",
  description:
    "Full reference for Mocko's HCL mock files: every mock, host, and data block field, heredocs, match priority, and file layout.",
};

export default function ReferenceMockFilesPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Reference</DocsEyebrow>
      <DocsTitle>Mock Files (HCL)</DocsTitle>
      <DocsLead>
        Every field accepted in <DocsCode>.hcl</DocsCode> mock files. For the
        guided introduction, start at{" "}
        <DocsLink href="/creating-mocks/file-mocks">File Mocks</DocsLink>.
      </DocsLead>

      <DocsH2>mock block</DocsH2>
      <DocsCodeBlock>{`mock "METHOD /path/{param}" {
  # fields
}`}</DocsCodeBlock>
      <DocsP>
        Methods: <DocsCode>GET</DocsCode>, <DocsCode>POST</DocsCode>,{" "}
        <DocsCode>PUT</DocsCode>, <DocsCode>DELETE</DocsCode>,{" "}
        <DocsCode>PATCH</DocsCode>, or <DocsCode>*</DocsCode> for any method.
        Path segments in braces (<DocsCode>{"{param}"}</DocsCode>) are
        parameters exposed as <DocsCode>{"{{request.params.<name>}}"}</DocsCode>
        .
      </DocsP>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Field</DocsTh>
            <DocsTh>Type</DocsTh>
            <DocsTh>Default</DocsTh>
            <DocsTh>Description</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>status</DocsCode>
            </DocsTd>
            <DocsTd>number (200 to 599)</DocsTd>
            <DocsTd>
              <DocsCode>201</DocsCode> for POST, <DocsCode>200</DocsCode>{" "}
              otherwise
            </DocsTd>
            <DocsTd>
              Response status. Templates can override it per request with{" "}
              <DocsCode>setStatus</DocsCode>.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>body</DocsCode>
            </DocsTd>
            <DocsTd>string</DocsTd>
            <DocsTd>empty</DocsTd>
            <DocsTd>
              Response body,{" "}
              <DocsLink href="/creating-mocks/templating">
                Bigodon template
              </DocsLink>
              , rendered per request.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>headers</DocsCode>
            </DocsTd>
            <DocsTd>block</DocsTd>
            <DocsTd>empty</DocsTd>
            <DocsTd>
              Response headers as <DocsCode>Name = &quot;value&quot;</DocsCode>{" "}
              pairs.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>format</DocsCode>
            </DocsTd>
            <DocsTd>string</DocsTd>
            <DocsTd>unset</DocsTd>
            <DocsTd>
              Sets Content-Type from a short name: <DocsCode>json</DocsCode>,{" "}
              <DocsCode>html</DocsCode>, <DocsCode>text</DocsCode>,{" "}
              <DocsCode>xml</DocsCode>, <DocsCode>javascript</DocsCode>,{" "}
              <DocsCode>css</DocsCode>. Mutually exclusive with an explicit
              Content-Type header.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>delay</DocsCode>
            </DocsTd>
            <DocsTd>number (0 to 300000)</DocsTd>
            <DocsTd>none</DocsTd>
            <DocsTd>
              Milliseconds to wait before responding. Applies to proxied
              responses too.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>enabled</DocsCode>
            </DocsTd>
            <DocsTd>boolean</DocsTd>
            <DocsTd>
              <DocsCode>true</DocsCode>
            </DocsTd>
            <DocsTd>Disable the mock without deleting it.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>name</DocsCode>
            </DocsTd>
            <DocsTd>string</DocsTd>
            <DocsTd>file path</DocsTd>
            <DocsTd>Label shown in the UI.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>labels</DocsCode>
            </DocsTd>
            <DocsTd>array of strings</DocsTd>
            <DocsTd>
              <DocsCode>[]</DocsCode>
            </DocsTd>
            <DocsTd>Tags for filtering in the UI.</DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>host</DocsCode>
            </DocsTd>
            <DocsTd>string</DocsTd>
            <DocsTd>unset</DocsTd>
            <DocsTd>
              Scope the mock to a{" "}
              <DocsLink href="/creating-mocks/proxying-and-hosts">
                host block
              </DocsLink>{" "}
              by slug; it then only matches requests with that host&apos;s{" "}
              <DocsCode>Host</DocsCode> header.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>parse</DocsCode>
            </DocsTd>
            <DocsTd>boolean</DocsTd>
            <DocsTd>
              <DocsCode>true</DocsCode>
            </DocsTd>
            <DocsTd>
              <DocsCode>false</DocsCode> skips request body parsing (the body is
              streamed raw). Use for large uploads or non-JSON payloads;{" "}
              <DocsCode>request.body</DocsCode> is unavailable in the template.
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>

      <DocsH2>Multi-line bodies (heredocs)</DocsH2>
      <DocsCodeBlock>{`# Strips leading indentation (preferred)
body = <<-EOF
  { "name": "{{request.params.name}}" }
EOF

# Preserves indentation exactly
body = <<EOF
{ "name": "{{request.params.name}}" }
EOF`}</DocsCodeBlock>
      <DocsP>
        In regular quoted strings, escaping literal braces requires a double
        backslash (<DocsCode>{"\\\\{{"}</DocsCode>) because HCL consumes one
        level; in heredocs a single backslash (<DocsCode>{"\\{{"}</DocsCode>) is
        enough.
      </DocsP>

      <DocsH2>host block</DocsH2>
      <DocsCodeBlock>{`host "slug" {
  name        = "Billing Service"
  source      = "billing.local"
  destination = "https://demo-billing.mockoapp.net"
}`}</DocsCodeBlock>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Field</DocsTh>
            <DocsTh>Required</DocsTh>
            <DocsTh>Description</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>
              <DocsCode>source</DocsCode>
            </DocsTd>
            <DocsTd>yes</DocsTd>
            <DocsTd>
              Hostname matched against the request&apos;s{" "}
              <DocsCode>Host</DocsCode> header.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>destination</DocsCode>
            </DocsTd>
            <DocsTd>no</DocsTd>
            <DocsTd>
              <DocsCode>http://</DocsCode> or <DocsCode>https://</DocsCode> URL.
              When set, unmatched requests on this host proxy there
              automatically. Also the target of{" "}
              <DocsCode>{"{{proxy 'slug'}}"}</DocsCode>.
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>
              <DocsCode>name</DocsCode>
            </DocsTd>
            <DocsTd>no</DocsTd>
            <DocsTd>Label shown in the UI.</DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>
      <DocsP>
        The slug (the block&apos;s string label) is limited to 12 characters:
        letters, digits, <DocsCode>-</DocsCode> and <DocsCode>_</DocsCode>.
      </DocsP>

      <DocsH2>data block</DocsH2>
      <DocsCodeBlock>{`data "settings" {
  base_url = "https://api.example.com"   # flat value

  environment {                          # named sub-block
    name = "staging"
  }
}`}</DocsCodeBlock>
      <DocsUl>
        <li>
          Flat values are read directly:{" "}
          <DocsCode>{"{{data.settings.base_url}}"}</DocsCode>.
        </li>
        <li>
          Named sub-blocks are <strong>always arrays</strong>, even when defined
          once: iterate with <DocsCode>forEach</DocsCode> or index with{" "}
          <DocsCode>
            {"{{pick (itemAt data.settings.environment 0) 'name'}}"}
          </DocsCode>
          .
        </li>
        <li>Data blocks with the same name merge across all loaded files.</li>
      </DocsUl>

      <DocsH2>Match priority</DocsH2>
      <DocsUl>
        <li>
          Exact paths beat parameterized paths (
          <DocsCode>/cats/george</DocsCode> beats{" "}
          <DocsCode>{"/cats/{name}"}</DocsCode>).
        </li>
        <li>
          Specific methods beat the <DocsCode>*</DocsCode> wildcard.
        </li>
        <li>
          Deployed (UI-created) mocks beat file mocks on the same method and
          path.
        </li>
        <li>
          Within equal specificity, the first declaration in the file wins.
        </li>
        <li>
          Unmatched requests return 404, unless a proxy target or a host{" "}
          <DocsCode>destination</DocsCode> applies.
        </li>
      </DocsUl>
      <DocsP>
        Worked examples are on{" "}
        <DocsLink href="/creating-mocks/matching">How Matching Works</DocsLink>.
      </DocsP>

      <DocsH2>File layout</DocsH2>
      <DocsUl>
        <li>
          Every <DocsCode>.hcl</DocsCode> file under the mocks folder is loaded
          and merged; nested folders are organizational only.
        </li>
        <li>
          Hidden files and folders (starting with <DocsCode>.</DocsCode>) are
          ignored.
        </li>
        <li>
          With <DocsCode>--watch</DocsCode>, changes to any loaded file reload
          the whole set.
        </li>
      </DocsUl>
    </DocsPage>
  );
}
