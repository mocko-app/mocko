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
  title: "How Matching Works",
  description:
    "How Mocko picks the mock that answers a request: exact versus parameterized paths, deployed versus file mocks, and what happens when nothing matches.",
};

export default function MatchingPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>How Matching Works</DocsTitle>
      <DocsLead>
        Once a project has more than a handful of mocks, two of them will
        eventually overlap. This page explains exactly how Mocko picks the mock
        that answers a request, and what happens when no mock matches at all.
      </DocsLead>

      <DocsH2>Exact paths beat parameterized paths</DocsH2>
      <DocsP>
        A route segment is either literal (<DocsCode>/users/me</DocsCode>) or a
        parameter (<DocsCode>{"/users/{id}"}</DocsCode>). When both could match
        a request, the more specific one wins, regardless of the order they were
        defined in:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "GET /users/{id}" {
  format = "json"
  body = <<-EOF
    { "id": {{request.params.id}}, "role": "member" }
  EOF
}

mock "GET /users/me" {
  format = "json"
  body = <<-EOF
    { "id": 1, "role": "admin" }
  EOF
}`}</DocsCodeBlock>
      <DocsSnippet
        command="curl http://localhost:8080/users/me"
        output={`{
  "id": 1,
  "role": "admin"
}`}
        className="mb-4"
      />
      <DocsP>
        This is what lets you mock a general route and then carve out one
        special case, a pattern the{" "}
        <DocsLink href="/recipes/mock-one-edge-case">
          Mock One Edge Case
        </DocsLink>{" "}
        recipe builds on.
      </DocsP>

      <DocsH2>Catch-all paths</DocsH2>
      <DocsP>
        A normal parameter like <DocsCode>{"{id}"}</DocsCode> matches exactly
        one segment. Add a <DocsCode>*</DocsCode> to make it a{" "}
        <em>catch-all</em> that swallows the rest of the path, however many
        segments it spans. The captured value arrives in{" "}
        <DocsCode>request.params</DocsCode> as a single string with the slashes
        intact:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "GET /files/{path*}" {
  format = "json"
  body = <<-EOF
    { "requested": "{{request.params.path}}" }
  EOF
}`}</DocsCodeBlock>
      <DocsSnippet
        command="curl http://localhost:8080/files/images/logo.png"
        output={`{
  "requested": "images/logo.png"
}`}
        className="mb-4"
      />
      <DocsP>
        A catch-all is the least specific way to match a path, so it loses to
        every literal segment and single-segment parameter it competes with.
        That makes <DocsCode>{"/{any*}"}</DocsCode> a natural fallback: pair it
        with more specific mocks and it answers only the requests nothing else
        claimed, an in-file alternative to the proxy pass-through described{" "}
        <DocsLink href="#when-nothing-matches">below</DocsLink>.
      </DocsP>
      <Callout variant="info">
        The <DocsCode>*</DocsCode> segment has to be the last one in the path.{" "}
        <DocsCode>{"/{any*}"}</DocsCode> matches any path (including{" "}
        <DocsCode>/</DocsCode> itself), while <DocsCode>{"/{path*2}"}</DocsCode>{" "}
        matches exactly two segments and nothing shorter or longer.
      </Callout>

      <DocsH2>Deployed mocks beat file mocks</DocsH2>
      <DocsP>
        When a mock created in the UI and a mock loaded from a file declare the
        same method and path, the deployed one wins. Think of the UI as a
        temporary override layer: your committed mocks describe the normal
        behavior, and a deployed mock can shadow one of them while you reproduce
        a scenario, without editing any file.
      </DocsP>
      <Callout variant="tip">
        Delete the deployed mock (or restart a storeless instance) and the file
        mock underneath resumes answering. Nothing needs to be undone in the
        files.
      </Callout>

      <DocsH2>Wildcard methods</DocsH2>
      <DocsP>
        A mock declared with <DocsCode>*</DocsCode> as the method matches any
        HTTP method on its path. Specific methods are more specific, so a{" "}
        <DocsCode>GET</DocsCode> mock on the same path takes precedence over the
        wildcard for GET requests.
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "* /maintenance-mode" {
  status = 503
  format = "json"
  body = <<-EOF
    { "error": "Service under maintenance" }
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Ties within the same specificity</DocsH2>
      <DocsP>
        If two mocks have the same method and equally specific paths, the one
        declared first in the file wins. Relying on declaration order is
        fragile, though: treat duplicate routes as a mistake to clean up, not a
        feature to exploit. The UI flags these situations for you, as described
        below.
      </DocsP>

      <DocsH2 id="when-nothing-matches">When nothing matches</DocsH2>
      <DocsP>
        A request that no mock matches gets a <DocsCode>404</DocsCode> with a
        message explaining that no mock was found. But if Mocko was started with
        a proxy URL, unmatched requests are forwarded to your real backend
        instead:
      </DocsP>
      <DocsSnippet
        command="mocko -u https://demo-api.mockoapp.net mocks"
        className="mb-4"
      />
      <DocsP>
        This turns Mocko into a selective layer in front of a real API: mocked
        routes answer locally, everything else passes through untouched.{" "}
        <DocsLink href="/creating-mocks/proxying-and-hosts">
          Proxying and Hosts
        </DocsLink>{" "}
        covers this in depth.
      </DocsP>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          Mocks scoped to a host with the <DocsCode>host</DocsCode> field only
          participate in matching for requests carrying that host&apos;s{" "}
          <DocsCode>Host</DocsCode> header. Unscoped mocks match any host.
        </li>
        <li>
          The UI annotates unreachable mocks. A file mock shadowed by a deployed
          mock on the same route is marked as shadowed, and two mocks competing
          for the same route are marked as conflicting, so precedence surprises
          show up in the panel instead of in your test runs.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        So far every response has been computed from the current request alone.
        Continue to <DocsLink href="/creating-mocks/flags">Flags</DocsLink> to
        give your mocks memory between requests.
      </DocsP>
    </DocsPage>
  );
}
