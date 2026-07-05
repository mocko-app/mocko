import type { Metadata } from "next";
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
  title: "How Matching Works",
  description:
    "Understand how Mocko chooses which mock handles a request, including path priority, wildcard methods, and host scoping.",
};

export default function MatchingPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>How Matching Works</DocsTitle>
      <DocsLead>
        Mocko maps each mock to an HTTP method, path, and optional host. When a
        request arrives, the most specific compatible route handles it.
      </DocsLead>

      <DocsH2>Path priority</DocsH2>
      <DocsP>
        Exact paths beat parameterized paths, and parameterized paths beat
        catch-all paths.
      </DocsP>
      <DocsCodeBlock>{`mock "GET /users/me" { body = "exact" }
mock "GET /users/{id}" { body = "param" }
mock "GET /users/{any*}" { body = "catch-all" }`}</DocsCodeBlock>

      <DocsH2>Method priority</DocsH2>
      <DocsP>
        Use <DocsCode>*</DocsCode> to match any method. A specific method wins
        over a wildcard method on the same route.
      </DocsP>
      <DocsCodeBlock>{`mock "GET /health" { body = "get" }
mock "* /health" { body = "any method" }`}</DocsCodeBlock>

      <DocsH2>File mocks and UI mocks</DocsH2>
      <DocsP>
        When a UI-created or deployed mock uses the same method and path as a
        file mock, the deployed mock wins. This lets the UI temporarily override
        file behavior without editing project files.
      </DocsP>

      <DocsH2>Host-scoped mocks</DocsH2>
      <DocsP>
        A mock with <DocsCode>host</DocsCode> only responds when the request
        Host header matches that host. File mocks can scope by a host slug or,
        for compatibility, a raw Host header value.
      </DocsP>
      <DocsCodeBlock>{`host "billing" {
  source      = "billing.local"
  destination = "http://billing:3000"
}

mock "GET /invoices/{id}" {
  host = "billing"
  body = "{ \\"id\\": {{request.params.id}} }"
}`}</DocsCodeBlock>

      <DocsH2>Reserved paths</DocsH2>
      <DocsP>
        Paths under <DocsCode>/__mocko__</DocsCode> are reserved for Mocko
        internals and cannot be mocked.
      </DocsP>
    </DocsPage>
  );
}
