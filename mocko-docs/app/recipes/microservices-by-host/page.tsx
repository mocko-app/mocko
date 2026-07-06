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
  title: "Mock Microservices by Host",
  description:
    "Stand in for several microservices with one Mocko instance: host blocks per service, host-scoped mocks, and per-host proxy fallback.",
};

export default function MicroservicesByHostPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Recipes</DocsEyebrow>
      <DocsTitle>Mock Microservices by Host</DocsTitle>
      <DocsLead>
        In a staging cluster or a local compose setup, an app talks to several
        services, and you rarely want to fake all of them. This recipe puts one
        Mocko in front of two services using{" "}
        <DocsLink href="/creating-mocks/proxying-and-hosts">
          host blocks
        </DocsLink>
        : each service keeps its real behavior except for the routes you
        override.
      </DocsLead>

      <DocsH2>The recipe</DocsH2>
      <DocsCodeBlock language="hcl">{`host "billing" {
  name        = "Billing Service"
  source      = "billing.local"
  destination = "https://demo-billing.mockoapp.net"
}

host "catalog" {
  name        = "Catalog Service"
  source      = "catalog.local"
  destination = "https://demo-catalog.mockoapp.net"
}

mock "GET /invoices/{id}" {
  host   = "billing"
  format = "json"
  body = <<-EOF
    { "id": {{request.params.id}}, "status": "past_due" }
  EOF
}

mock "GET /products/{id}" {
  host   = "catalog"
  format = "json"
  body = <<-EOF
    { "id": {{request.params.id}}, "inStock": false }
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Try it</DocsH2>
      <DocsP>
        Mocko routes by the <DocsCode>Host</DocsCode> header, which you can set
        by hand to test:
      </DocsP>
      <DocsSnippet
        command={`curl -H 'Host: billing.local' http://localhost:8080/invoices/3`}
        output={`{
  "id": 3,
  "status": "past_due"
}`}
        className="mb-4"
      />
      <DocsSnippet
        command={`curl -H 'Host: catalog.local' http://localhost:8080/categories`}
        output={`[
  { "id": 1, "name": "Electronics" },
  { "id": 2, "name": "Home" },
  { "id": 3, "name": "Toys" }
]`}
        className="mb-4"
      />

      <DocsH2>How it works</DocsH2>
      <DocsUl>
        <li>
          Each <DocsCode>host</DocsCode> block matches incoming requests whose{" "}
          <DocsCode>Host</DocsCode> header equals its{" "}
          <DocsCode>source</DocsCode>.
        </li>
        <li>
          Mocks with <DocsCode>host = &quot;billing&quot;</DocsCode> only answer
          billing traffic, so both services can mock{" "}
          <DocsCode>GET /health</DocsCode> or any overlapping route without
          colliding.
        </li>
        <li>
          Requests on a host that no mock matches are proxied to that
          host&apos;s <DocsCode>destination</DocsCode> automatically. That is
          the passthrough: the categories request above never had a mock, so the
          real catalog backend answered. The destinations here point at live
          demo backends, so the whole recipe runs as-is.
        </li>
      </DocsUl>

      <DocsH2>Pointing your app at it</DocsH2>
      <DocsP>
        Outside of curl, the <DocsCode>Host</DocsCode> header comes from the URL
        your app resolves, so point the service hostnames at Mocko:
      </DocsP>
      <DocsUl>
        <li>
          Locally, map <DocsCode>billing.local</DocsCode> and{" "}
          <DocsCode>catalog.local</DocsCode> to <DocsCode>127.0.0.1</DocsCode>{" "}
          in <DocsCode>/etc/hosts</DocsCode> and call{" "}
          <DocsCode>http://billing.local:8080</DocsCode>.
        </li>
        <li>
          In Docker Compose, alias the Mocko container as both hostnames on the
          network; see{" "}
          <DocsLink href="/running/compose">Docker Compose</DocsLink>.
        </li>
        <li>
          In Kubernetes, point the services&apos; names (or your app&apos;s
          service URLs) at the Mocko deployment; see{" "}
          <DocsLink href="/running/helm">Kubernetes with Helm</DocsLink>.
        </li>
      </DocsUl>
      <Callout variant="info">
        <DocsCode>destination</DocsCode> is optional. Omit it for a service you
        want fully mocked: matched routes answer, and anything else on that host
        falls through to the instance-wide behavior described in{" "}
        <DocsLink href="/creating-mocks/matching">How Matching Works</DocsLink>.
      </Callout>

      <DocsH2>Variations</DocsH2>
      <DocsUl>
        <li>
          Combine with the{" "}
          <DocsLink href="/recipes/mock-one-edge-case">
            Mock One Edge Case
          </DocsLink>{" "}
          pattern inside a host-scoped mock to break one branch of one service.
        </li>
        <li>
          Hosts can also be created in the UI on a running instance, useful when
          the set of services changes while a staging environment is up.
        </li>
      </DocsUl>
    </DocsPage>
  );
}
