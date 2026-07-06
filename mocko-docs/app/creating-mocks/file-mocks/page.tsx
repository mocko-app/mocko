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
  title: "File Mocks",
  description:
    "Define Mocko mocks in versioned HCL files: routes, path parameters, response bodies, headers, delays, and multi-file project layout.",
};

export default function FileMocksPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>File Mocks</DocsTitle>
      <DocsLead>
        File mocks live in <DocsCode>.hcl</DocsCode> files inside your project,
        so they can be reviewed, versioned, and run identically by every
        developer and in CI. By the end of this page you will know the full
        anatomy of a mock file: routes, path parameters, response fields, and
        how to organize mocks across files.
      </DocsLead>

      <DocsH2>Your first mock file</DocsH2>
      <DocsP>
        Create a folder for your mocks and add a file to it. The file name is up
        to you, only the <DocsCode>.hcl</DocsCode> extension matters.
      </DocsP>
      <DocsCodeBlock language="text">{`mocks/
  users.hcl`}</DocsCodeBlock>
      <DocsCodeBlock language="hcl">{`mock "GET /users/{id}" {
  format = "json"
  body = <<-EOF
    {
      "id": {{request.params.id}},
      "name": "Alice Martins",
      "email": "alice@example.com"
    }
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        Point the CLI at the folder. The <DocsCode>--watch</DocsCode> flag
        reloads mocks whenever a file changes, which is what you want during
        development.
      </DocsP>
      <DocsSnippet command="mocko --watch mocks" className="mb-4" />
      <DocsSnippet
        command="curl http://localhost:8080/users/7"
        output={`{
  "id": 7,
  "name": "Alice Martins",
  "email": "alice@example.com"
}`}
        className="mb-4"
      />
      <DocsP>
        The <DocsCode>{"{id}"}</DocsCode> segment in the route matched the
        request path, and <DocsCode>{"{{request.params.id}}"}</DocsCode>{" "}
        rendered it into the response. Mock bodies are templates, and they can
        do much more than echo parameters. The next pages cover that in depth;
        this page focuses on the file itself.
      </DocsP>

      <DocsH2>The mock block</DocsH2>
      <DocsP>
        Every mock starts with a route string:{" "}
        <DocsCode>mock &quot;METHOD /path&quot;</DocsCode>. The method can be{" "}
        <DocsCode>GET</DocsCode>, <DocsCode>POST</DocsCode>,{" "}
        <DocsCode>PUT</DocsCode>, <DocsCode>DELETE</DocsCode>,{" "}
        <DocsCode>PATCH</DocsCode>, or <DocsCode>*</DocsCode> to match any
        method. Path segments wrapped in braces, like{" "}
        <DocsCode>{"{id}"}</DocsCode>, are parameters: they match any value in
        that position and expose it to the body template.
      </DocsP>
      <DocsP>
        Inside the block, everything is optional. A mock with an empty body and
        no fields is already a valid 200 response. These are the fields you will
        use most:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "POST /users" {
  status = 201
  delay  = 300
  format = "json"
  body = <<-EOF
    {
      "id": 42,
      "name": "{{request.body.name}}"
    }
  EOF
}`}</DocsCodeBlock>
      <DocsUl>
        <li>
          <DocsCode>status</DocsCode> sets the response code. If you omit it,
          Mocko uses <DocsCode>201</DocsCode> for <DocsCode>POST</DocsCode> and{" "}
          <DocsCode>200</DocsCode> for everything else, so the{" "}
          <DocsCode>status = 201</DocsCode> above is redundant and shown only
          for clarity.
        </li>
        <li>
          <DocsCode>delay</DocsCode> waits the given number of milliseconds
          before responding. Useful for testing loading states and timeouts.
        </li>
        <li>
          <DocsCode>format</DocsCode> sets the response Content-Type from a
          short name: <DocsCode>json</DocsCode>, <DocsCode>html</DocsCode>,{" "}
          <DocsCode>text</DocsCode>, <DocsCode>xml</DocsCode>,{" "}
          <DocsCode>javascript</DocsCode>, or <DocsCode>css</DocsCode>.
        </li>
        <li>
          <DocsCode>body</DocsCode> is the response body, rendered as a template
          on every request.
        </li>
      </DocsUl>

      <DocsH2>Response headers</DocsH2>
      <DocsP>
        When you need headers beyond Content-Type, add a{" "}
        <DocsCode>headers</DocsCode> block:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "GET /users/{id}" {
  headers {
    Content-Type    = "application/json"
    Cache-Control   = "no-store"
    X-Request-Trace = "mocked"
  }
  body = <<-EOF
    { "id": {{request.params.id}} }
  EOF
}`}</DocsCodeBlock>
      <Callout variant="warning">
        <DocsCode>format</DocsCode> and an explicit Content-Type header are
        mutually exclusive: setting both fails validation when the file loads.
        Use <DocsCode>format</DocsCode> alone, or declare Content-Type inside{" "}
        <DocsCode>headers</DocsCode> along with the rest.
      </Callout>

      <DocsH2>Multi-line bodies</DocsH2>
      <DocsP>
        Bodies almost always span multiple lines, so mock files use HCL
        heredocs. The <DocsCode>&lt;&lt;-EOF</DocsCode> form (with the dash)
        strips the leading indentation from every line, which lets you indent
        the body naturally inside the block. The{" "}
        <DocsCode>&lt;&lt;EOF</DocsCode> form preserves whitespace exactly as
        written.
      </DocsP>
      <DocsCodeBlock language="hcl">{`# Strips leading indentation (use this one)
body = <<-EOF
  { "name": "Alice" }
EOF

# Preserves indentation exactly
body = <<EOF
{ "name": "Alice" }
EOF`}</DocsCodeBlock>
      <Callout variant="tip">
        When the body is valid JSON, Mocko pretty-prints it automatically, so
        you never need to worry about whitespace or indentation inside JSON
        bodies.
      </Callout>

      <DocsH2>Naming and organizing mocks</DocsH2>
      <DocsP>
        Three more fields help once a project accumulates mocks. None of them
        change how a mock responds:
      </DocsP>
      <DocsUl>
        <li>
          <DocsCode>name</DocsCode> is the label shown in the Mocko UI. It
          defaults to the file path.
        </li>
        <li>
          <DocsCode>labels</DocsCode> is a list of tags used for filtering in
          the UI, for example{" "}
          <DocsCode>labels = [&quot;users&quot;, &quot;errors&quot;]</DocsCode>.
        </li>
        <li>
          <DocsCode>enabled = false</DocsCode> turns a mock off without deleting
          it. Handy for keeping an error-case mock in the file and flipping it
          on when needed.
        </li>
      </DocsUl>

      <DocsH2>Splitting mocks across files</DocsH2>
      <DocsP>
        Mocko loads every <DocsCode>.hcl</DocsCode> file under the folder you
        pass to the CLI and merges them. Nested folders are purely
        organizational, so structure them however reads best for your project:
      </DocsP>
      <DocsCodeBlock language="text">{`mocks/
  users.hcl          # mocks for /users routes
  orders.hcl         # mocks for /orders routes
  shared/
    data.hcl         # data blocks shared across all mocks`}</DocsCodeBlock>
      <DocsP>
        Mocks, hosts, and data blocks from all files end up in one merged
        configuration. Files and folders whose names start with a dot are
        ignored.
      </DocsP>

      <DocsH2>When something goes wrong</DocsH2>
      <DocsP>
        If a file has a syntax error or an invalid field, Mocko prints the error
        to the terminal when it loads the folder, including the line and column
        for template errors. With <DocsCode>--watch</DocsCode> you can fix the
        file and save; Mocko reloads and reports again.
      </DocsP>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          File mocks appear in the Mocko UI as read-only, so the versioned files
          stay the single source of truth.
        </li>
        <li>
          There is also a <DocsCode>host</DocsCode> field for scoping a mock to
          a virtual host, covered in{" "}
          <DocsLink href="/creating-mocks/proxying-and-hosts">
            Proxying and Hosts
          </DocsLink>
          , and a <DocsCode>parse = false</DocsCode> option for streaming raw
          request bodies, covered in the{" "}
          <DocsLink href="/reference/mock-files">mock file reference</DocsLink>.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        Mocko also has a control panel for creating mocks without touching
        files. Continue to{" "}
        <DocsLink href="/creating-mocks/ui-mocks">UI Mocks</DocsLink> to see
        when each workflow fits.
      </DocsP>
    </DocsPage>
  );
}
