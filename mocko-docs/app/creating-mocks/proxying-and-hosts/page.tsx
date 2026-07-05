import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Proxying and Hosts",
  description:
    "Proxy unmatched requests, proxy conditionally from templates, and scope Mocko mocks by Host header.",
};

export default function ProxyingAndHostsPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>Proxying and Hosts</DocsTitle>
      <DocsLead>
        Mocko can sit in front of real services. Mock the endpoints you need and
        proxy everything else to the real backend.
      </DocsLead>

      <DocsH2>Default proxy</DocsH2>
      <DocsCodeBlock>mocko -u http://localhost:3000 mocks</DocsCodeBlock>
      <DocsP>
        When no mock matches, Mocko proxies the request to the configured base
        URL. The method, path, query, headers, and body are passed through.
      </DocsP>

      <DocsH2>Proxy from a template</DocsH2>
      <DocsCodeBlock>{`mock "GET /posts" {
  body = <<-EOF
    {{#is request.query.userId 1}}
      []
    {{else}}
      {{proxy}}
    {{/is}}
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        <DocsCode>{"{{proxy}}"}</DocsCode> halts template execution. Anything
        after it is ignored.
      </DocsP>

      <DocsH2>Define hosts</DocsH2>
      <DocsP>
        Hosts map incoming Host header values to optional proxy destinations.
        Mocks can also be scoped to a host.
      </DocsP>
      <DocsCodeBlock>{`host "billing" {
  source      = "billing.local"
  destination = "http://billing:3000"
}

mock "GET /invoices/{id}" {
  host = "billing"
  body = "{ \\"id\\": {{request.params.id}}, \\"status\\": \\"paid\\" }"
}`}</DocsCodeBlock>

      <DocsH2>Proxy to a host by slug</DocsH2>
      <DocsCodeBlock>{`mock "GET /passthrough/{any*}" {
  body = "{{proxy 'billing'}}"
}`}</DocsCodeBlock>

      <DocsH2>Destination-less hosts</DocsH2>
      <DocsP>
        A host can omit <DocsCode>destination</DocsCode>. That still lets you
        scope mocks by Host header. Unmatched requests fall back to the global
        proxy if one is configured, otherwise they return 404.
      </DocsP>

      <DocsP>
        See{" "}
        <Link
          href="/recipes"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Mock Microservices by Host
        </Link>{" "}
        for a larger example.
      </DocsP>
    </DocsPage>
  );
}
