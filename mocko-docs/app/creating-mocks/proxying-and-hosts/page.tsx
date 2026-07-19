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
  title: "Proxying and Hosts",
  description:
    "Blend Mocko mocks with real backends: proxy unmatched requests, proxy conditionally from templates, and route multiple services with host blocks.",
};

export default function ProxyingAndHostsPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>Proxying and Hosts</DocsTitle>
      <DocsLead>
        Most of the time you do not want to mock a whole API, just the parts
        that matter for the scenario at hand. This page shows how Mocko sits in
        front of real backends: forwarding unmatched requests, proxying
        conditionally from inside a template, and routing multiple services
        through one instance with hosts.
      </DocsLead>

      <DocsH2>Forward what you do not mock</DocsH2>
      <DocsP>
        Start Mocko with a proxy URL and point your app at Mocko instead of the
        real API:
      </DocsP>
      <DocsSnippet
        command="mocko -u https://demo-api.mockoapp.net mocks"
        className="mb-4"
      />
      <DocsP>
        Requests that match a mock are answered by the mock. Everything else is
        forwarded to <DocsCode>https://demo-api.mockoapp.net</DocsCode> (a demo
        backend you can actually hit) with the same method, path, query string,
        headers, and body, and the backend&apos;s response comes back untouched.
        Your app cannot tell the difference; it just sees an API where one or
        two routes happen to be under your control.
      </DocsP>

      <DocsH2>Proxying from inside a template</DocsH2>
      <DocsP>
        The <DocsCode>proxy</DocsCode> helper moves that decision into the body,
        so a single route can be partly real and partly mocked:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "GET /posts" {
  body = <<-EOF
    {{#is request.query.userId 1}}
      []
    {{else}}
      {{proxy}}
    {{/is}}
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        User 1 gets an empty list, everyone else gets the real backend. This is
        the single most useful pattern for testing edge cases against live
        systems, and the{" "}
        <DocsLink href="/recipes/mock-one-edge-case">
          Mock One Edge Case
        </DocsLink>{" "}
        recipe explores variations of it.
      </DocsP>
      <Callout variant="warning">
        <DocsCode>{"{{proxy}}"}</DocsCode> halts template execution: the proxied
        response becomes the entire response, and anything after the helper in
        the template is ignored.
      </Callout>
      <DocsP>
        <DocsCode>proxy</DocsCode> also accepts a destination, used as a base
        URL with the request path appended. <DocsCode>GET /users/42</DocsCode>{" "}
        through <DocsCode>{"{{proxy 'http://other:3000'}}"}</DocsCode> becomes{" "}
        <DocsCode>GET http://other:3000/users/42</DocsCode>. That lets different
        branches of one template proxy to different backends.
      </DocsP>

      <DocsH2>Hosts: several services, one Mocko</DocsH2>
      <DocsP>
        A <DocsCode>host</DocsCode> block gives a name to an upstream service
        and matches incoming requests by their <DocsCode>Host</DocsCode> header.
        This is how one Mocko instance stands in for several microservices at
        once:
      </DocsP>
      <DocsCodeBlock language="hcl">{`host "billing" {
  name        = "Billing Service"
  source      = "billing.local"
  destination = "https://demo-billing.mockoapp.net"
}

mock "GET /invoices/{id}" {
  host   = "billing"
  format = "json"
  body = <<-EOF
    { "id": "{{request.params.id}}", "status": "past_due" }
  EOF
}`}</DocsCodeBlock>
      <DocsUl>
        <li>
          <DocsCode>source</DocsCode> is the hostname to match on incoming
          requests.
        </li>
        <li>
          <DocsCode>destination</DocsCode> is optional. When set, requests for
          this host that no mock matches are proxied there automatically, so
          each host gets its own passthrough backend.
        </li>
        <li>
          A mock with <DocsCode>host = &quot;billing&quot;</DocsCode> only
          answers requests carrying that host&apos;s <DocsCode>Host</DocsCode>{" "}
          header. Mocks without a <DocsCode>host</DocsCode> field answer any
          host.
        </li>
      </DocsUl>
      <DocsSnippet
        command={`curl -H 'Host: billing.local' http://localhost:8080/invoices/7`}
        output={`{
  "id": 7,
  "status": "past_due"
}`}
        className="mb-4"
      />
      <DocsP>
        In real setups the <DocsCode>Host</DocsCode> header comes from DNS or
        service discovery rather than a curl flag: point{" "}
        <DocsCode>billing.local</DocsCode> at Mocko and the routing is
        automatic. The{" "}
        <DocsLink href="/recipes/microservices-by-host">
          Mock Microservices by Host
        </DocsLink>{" "}
        recipe walks through a complete two-service setup.
      </DocsP>
      <DocsP>
        Templates can proxy to a named host by its slug, which keeps destination
        URLs out of mock bodies:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "GET /passthrough" {
  body = "{{proxy 'billing'}}"
}`}</DocsCodeBlock>
      <DocsP>
        If the string matches no host slug, it is proxied as a literal URL
        instead. Write <DocsCode>{"{{proxy '@billing'}}"}</DocsCode> to always
        mean the named host: with the <DocsCode>@</DocsCode> prefix a missing
        slug fails the request with a clear error in the server log instead of
        proxying to a garbled address.
      </DocsP>

      <DocsH2>Hosts in the UI</DocsH2>
      <DocsP>
        Hosts can also be created and edited in the control panel, alongside
        mocks. Hosts defined in files are read-only there, and hosts created in
        the UI follow the same persistence rules as deployed mocks: in-memory by
        default, durable with Redis.
      </DocsP>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          Proxied requests time out after 30 seconds by default. Tune it with{" "}
          <DocsCode>-t</DocsCode> on the CLI or the equivalent{" "}
          <DocsLink href="/reference/configuration">configuration</DocsLink> on
          deployed instances.
        </li>
        <li>
          A mock&apos;s <DocsCode>delay</DocsCode> applies before proxying too,
          so <DocsCode>delay = 3000</DocsCode> plus{" "}
          <DocsCode>{"{{proxy}}"}</DocsCode> simulates a slow but otherwise real
          backend.
        </li>
        <li>
          Proxied requests carry <DocsCode>x-forwarded-*</DocsCode> headers, and
          the original <DocsCode>Host</DocsCode> header passes through.
        </li>
        <li>
          Without a proxy URL, a host destination, or a{" "}
          <DocsCode>{"{{proxy}}"}</DocsCode> call, unmatched requests return{" "}
          <DocsCode>404</DocsCode>, as covered in{" "}
          <DocsLink href="/creating-mocks/matching">
            How Matching Works
          </DocsLink>
          .
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        Hosts also give outbound requests a target: continue to{" "}
        <DocsLink href="/creating-mocks/callbacks">Callbacks</DocsLink> to make
        Mocko call your services back, like the webhooks your real integrations
        send.
      </DocsP>
    </DocsPage>
  );
}
