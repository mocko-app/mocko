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
  title: "Mock One Edge Case",
  description:
    "Proxy normal traffic to the real backend with Mocko while mocking a single route, query branch, or request shape you need to test.",
};

export default function MockOneEdgeCasePage() {
  return (
    <DocsPage>
      <DocsEyebrow>Recipes</DocsEyebrow>
      <DocsTitle>Mock One Edge Case</DocsTitle>
      <DocsLead>
        The backend works fine; you just cannot make it produce the case you
        need. An empty result, a permissions error, a malformed record. This
        recipe keeps all traffic flowing to the real API and intercepts exactly
        one branch, using{" "}
        <DocsLink href="/creating-mocks/proxying-and-hosts">proxying</DocsLink>{" "}
        and{" "}
        <DocsLink href="/creating-mocks/matching">match precedence</DocsLink>.
      </DocsLead>

      <DocsH2>The recipe</DocsH2>
      <DocsP>
        Start Mocko with your real backend as the proxy target, and point your
        app at Mocko:
      </DocsP>
      <DocsSnippet
        command="mocko -u https://demo-api.mockoapp.net mocks"
        className="mb-4"
      />
      <DocsCodeBlock language="hcl">{`mock "GET /posts" {
  body = <<-EOF
    {{#is request.query.userId 1}}
      []
    {{else}}
      {{proxy}}
    {{/is}}
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Try it</DocsH2>
      <DocsP>
        This example proxies to a live demo backend, so it runs as-is. User 1
        hits the mocked empty state; every other request, on this route or any
        other, gets the real thing:
      </DocsP>
      <DocsSnippet
        command={`curl 'http://localhost:8080/posts?userId=1'`}
        output="[]"
        className="mb-4"
      />
      <DocsSnippet
        command="curl http://localhost:8080/posts"
        output={`[
  { "id": 1, "userId": 1, "title": "Getting started with mocking" },
  { "id": 2, "userId": 2, "title": "Designing good test data" },
  { "id": 3, "userId": 2, "title": "Contract testing in practice" }
]`}
        className="mb-4"
      />

      <DocsH2>How it works</DocsH2>
      <DocsUl>
        <li>
          The mock owns the whole <DocsCode>GET /posts</DocsCode> route, but
          only the <DocsCode>userId=1</DocsCode> branch renders a mocked
          response. Every other request falls into the{" "}
          <DocsCode>{"{{proxy}}"}</DocsCode> branch and is forwarded with its
          original method, path, query, headers, and body.
        </li>
        <li>
          Routes with no mock at all never reach a template: the proxy URL from{" "}
          <DocsCode>-u</DocsCode> handles them directly.
        </li>
        <li>
          <DocsCode>{"{{proxy}}"}</DocsCode> halts the template, so the
          backend&apos;s response is returned exactly as received.
        </li>
      </DocsUl>

      <DocsH2>Variations</DocsH2>
      <DocsP>
        <strong className="text-foreground">One resource misbehaves.</strong>{" "}
        Exact paths beat parameterized ones, and mocked routes beat the proxy
        fallback, so you can break a single record while all others stay real:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "GET /posts/99" {
  status = 500
  format = "json"
  body = <<-EOF
    { "error": "Internal server error" }
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        <strong className="text-foreground">
          Opt in with a request header.
        </strong>{" "}
        Let the mock stay dormant until a client asks for the scenario, which is
        great on shared instances where other people use the same routes:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "GET /posts/{id}" {
  body = <<-EOF
    {{#is request.headers.x-scenario 'deleted'}}
      {{setStatus 410}}
      { "error": "This post was removed" }
    {{else}}
      {{proxy}}
    {{/is}}
  EOF
}`}</DocsCodeBlock>
      <Callout variant="tip">
        For scenarios you flip on and off at runtime instead of per request,
        gate the branch on a flag with{" "}
        <DocsCode>{"{{#hasFlag 'scenario:empty-posts'}}"}</DocsCode> and toggle
        it from the flags panel or the{" "}
        <DocsLink href="/sdk/getting-started">SDK</DocsLink>. The outage example
        on the <DocsLink href="/creating-mocks/flags">Flags</DocsLink> page is
        exactly this shape.
      </Callout>
    </DocsPage>
  );
}
