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

export const metadata: Metadata = {
  title: "Simulate Slow or Unstable APIs",
  description:
    "Use Mocko to add latency, random failures, and outages in front of an otherwise healthy backend to test loading states, retries, and timeouts.",
};

export default function SlowUnstableApisPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Recipes</DocsEyebrow>
      <DocsTitle>Simulate Slow or Unstable APIs</DocsTitle>
      <DocsLead>
        Retry logic, loading spinners, and timeout handling only reveal their
        bugs when the network misbehaves. This recipe makes a dependency slow
        and flaky on demand, combining <DocsCode>delay</DocsCode>, the{" "}
        <DocsCode>random</DocsCode> helper, and{" "}
        <DocsLink href="/creating-mocks/proxying-and-hosts">proxying</DocsLink>{" "}
        so successful requests still hit the real backend.
      </DocsLead>

      <DocsH2>The recipe</DocsH2>
      <DocsCodeBlock language="hcl">{`mock "GET /reports/{id}" {
  delay = 1000
  body = <<-EOF
    {{#lt (random 0 100) 30}}
      {{setStatus 500}}
      { "message": "Internal server error" }
    {{else}}
      {{proxy}}
    {{/lt}}
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        Started with{" "}
        <DocsCode>mocko -u https://demo-api.mockoapp.net mocks</DocsCode> (a
        live demo backend that serves <DocsCode>{"GET /reports/{id}"}</DocsCode>
        ), this makes every reports request take an extra second, and roughly
        30% of them fail with a <DocsCode>500</DocsCode>. The rest are served by
        the real backend.
      </DocsP>

      <DocsH2>How it works</DocsH2>
      <DocsUl>
        <li>
          <DocsCode>delay = 1000</DocsCode> waits one second before answering,
          and it applies to the proxied branch too, so even successful requests
          feel slow.
        </li>
        <li>
          <DocsCode>{"{{random 0 100}}"}</DocsCode> rolls a fresh number per
          request (inclusive on both ends), and the <DocsCode>lt</DocsCode>{" "}
          block turns it into a 30% failure rate. Adjust the threshold to taste.
        </li>
        <li>
          <DocsCode>{"{{proxy}}"}</DocsCode> forwards the request untouched, so
          response shapes stay real. Without a proxy target you can render a
          fixture body in the else branch instead.
        </li>
      </DocsUl>

      <DocsH2>Variations</DocsH2>
      <DocsP>
        <strong className="text-foreground">Trigger client timeouts.</strong>{" "}
        Crank the delay past your client&apos;s timeout budget.{" "}
        <DocsCode>delay</DocsCode> goes up to 300000 milliseconds:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "GET /reports/{id}" {
  delay = 30000
  body = "{{proxy}}"
}`}</DocsCodeBlock>
      <DocsP>
        <strong className="text-foreground">A hard outage.</strong> Keep a
        disabled mock in the file and flip it on when you want the dependency
        down. Enable it from the file or the UI:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "* /reports/{id}" {
  enabled = false
  status  = 503
  format  = "json"
  body = <<-EOF
    { "error": "Service unavailable" }
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        <strong className="text-foreground">Failures on demand.</strong> For a
        toggle you can flip at runtime without touching files, gate the failure
        branch on a flag, as in the outage example on the{" "}
        <DocsLink href="/creating-mocks/flags">Flags</DocsLink> page. Tests can
        flip it through the <DocsLink href="/sdk/getting-started">SDK</DocsLink>
        .
      </DocsP>
      <Callout variant="info">
        Random failures make test runs nondeterministic by design. Use them for
        manual exploration and resilience demos; for CI, prefer the flag-gated
        variant so each test controls exactly when the failure happens.
      </Callout>
    </DocsPage>
  );
}
