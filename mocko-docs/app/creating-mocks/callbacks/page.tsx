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
  title: "Callbacks",
  description:
    "Simulate the webhooks your integrations send back: define callback blocks, trigger them from mocks with delays and payloads, and manage pending deliveries.",
};

export default function CallbacksPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>Callbacks</DocsTitle>
      <DocsLead>
        Mocks cover the requests your system sends to its integrations. Many
        integrations also call you back: a payment provider confirms a charge, a
        signing service reports a finished document, a job runner posts its
        result. Callbacks are how Mocko simulates that direction. A mock
        schedules one, and Mocko delivers an HTTP request to your service after
        it responds, with any delay you want.
      </DocsLead>

      <DocsH2>Your first callback</DocsH2>
      <DocsP>
        A callback is defined in its own block, separate from mocks, and
        triggered by name with the <DocsCode>callback</DocsCode> helper. This
        pair simulates a payment provider: the mock answers{" "}
        <DocsCode>PENDING</DocsCode> right away, and two seconds later Mocko
        posts the approval to your service, like the real provider would.
      </DocsP>
      <DocsCodeBlock language="hcl">{`callback "payment-approved" {
  url   = "http://localhost:3000/webhooks/payments"
  delay = 2000
  body  = <<-EOF
    { "id": "{{payload.id}}", "status": "APPROVED" }
  EOF
}

mock "POST /payments" {
  format = "json"
  body = <<-EOF
    {{callback 'payment-approved' (object id=request.body.id)}}
    { "id": "{{request.body.id}}", "status": "PENDING" }
  EOF
}`}</DocsCodeBlock>
      <DocsSnippet
        command={`curl -X POST http://localhost:8080/payments -d '{"id": "pay-42"}' -H 'content-type: application/json'`}
        output={`{
  "id": "pay-42",
  "status": "PENDING"
}`}
        className="mb-4"
      />
      <DocsP>
        Two seconds after that response, your service on port 3000 receives:
      </DocsP>
      <DocsCodeBlock language="text">{`POST /webhooks/payments
content-type: application/json

{ "id": "pay-42", "status": "APPROVED" }`}</DocsCodeBlock>
      <DocsP>
        The flow that used to block your team in staging, waiting for a webhook
        that never comes from a sandbox, now completes on its own.
      </DocsP>

      <DocsH2>The callback block</DocsH2>
      <DocsCodeBlock language="hcl">{`callback "payment-approved" {
  name   = "Payment approved"          # optional label for the UI
  method = "POST"                      # optional, default POST
  host   = "backend"                   # a host block slug...
  path   = "/payments/{{payload.id}}"  # ...plus a path, or:
  # url  = "http://localhost:3000/cb"  # an absolute URL
  delay  = 2000                        # default delay in ms, default 0
  headers {
    X-Source = "mocko"
  }
  body = <<-EOF
    { "id": "{{payload.id}}" }
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        The target is either <DocsCode>host</DocsCode> plus{" "}
        <DocsCode>path</DocsCode>, or an absolute <DocsCode>url</DocsCode>,
        never both. Targeting a{" "}
        <DocsLink href="/creating-mocks/proxying-and-hosts">
          host block
        </DocsLink>{" "}
        is the better default in shared deployments: the callback follows the
        host&apos;s destination, so pointing an environment at a different
        backend is one host edit instead of a hunt through callback URLs.
      </DocsP>
      <DocsP>
        <DocsCode>path</DocsCode>, <DocsCode>url</DocsCode>,{" "}
        <DocsCode>body</DocsCode>, and header values are all Bigodon templates.
        When a <DocsCode>body</DocsCode> is set and no header says otherwise,{" "}
        <DocsCode>Content-Type</DocsCode> defaults to{" "}
        <DocsCode>application/json</DocsCode>.
      </DocsP>

      <DocsH2>Triggering from mocks</DocsH2>
      <DocsCodeBlock language="bigodon">{`{{callback 'payment-approved'}}                              {{! block defaults }}
{{callback 'payment-approved' delay=5000}}                   {{! override the delay }}
{{callback 'payment-approved' (object id=request.body.id)}}  {{! object payload }}
{{callback 'payment-approved' 'EXPIRED'}}                    {{! any JSON value works }}`}</DocsCodeBlock>
      <DocsP>
        The positional argument is the payload, any JSON-serializable value. It
        travels with the scheduled callback and comes back as{" "}
        <DocsCode>payload</DocsCode> in the callback&apos;s templates. The{" "}
        <DocsCode>delay=</DocsCode> parameter overrides the block&apos;s{" "}
        <DocsCode>delay</DocsCode>; without either, delivery happens right after
        the response.
      </DocsP>
      <DocsP>
        The helper renders as an empty string and never slows the mock down: the
        callback is enqueued when the mock responds, and the delay counts from
        there. Triggering an unknown slug, or a host without a destination,
        fails the mock with a <DocsCode>500</DocsCode> so broken wiring surfaces
        immediately instead of silently dropping deliveries.
      </DocsP>

      <DocsH2>Rendered at delivery time</DocsH2>
      <DocsP>
        Callback templates render when the callback fires, not when it is
        scheduled. Their context is <DocsCode>payload</DocsCode> and{" "}
        <DocsCode>data</DocsCode>; the triggering <DocsCode>request</DocsCode>{" "}
        is gone by then, so anything you need from it goes into the payload.
        Rendering late is what makes callbacks the right place for state
        transitions: pair them with{" "}
        <DocsLink href="/creating-mocks/flags">flags</DocsLink> and the state
        flips when the &quot;webhook&quot; happens, not when the request came
        in.
      </DocsP>
      <DocsCodeBlock language="hcl">{`callback "payment-approved" {
  host  = "backend"
  path  = "/webhooks/payments"
  delay = 2000
  body  = <<-EOF
    {{setFlag (append 'payments:' payload.id ':status') 'APPROVED'}}
    { "id": "{{payload.id}}", "status": "APPROVED" }
  EOF
}

mock "GET /payments/{id}" {
  format = "json"
  body = <<-EOF
    {{= $status (default (getFlag (append 'payments:' request.params.id ':status')) 'PENDING')}}
    { "id": "{{request.params.id}}", "status": "{{$status}}" }
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        Polling <DocsCode>GET /payments/pay-42</DocsCode> answers{" "}
        <DocsCode>PENDING</DocsCode> until the callback fires, then{" "}
        <DocsCode>APPROVED</DocsCode>: the two consumption styles real payment
        APIs offer, webhooks and polling, from one pair of blocks.
      </DocsP>
      <Callout variant="warning">
        Callback bodies support every helper except{" "}
        <DocsCode>setStatus</DocsCode>, <DocsCode>setHeader</DocsCode>,{" "}
        <DocsCode>proxy</DocsCode>, and <DocsCode>callback</DocsCode> itself.
        There is no response to shape and no chaining; a mock schedules every
        callback it needs up front, each with its own delay.
      </Callout>

      <DocsH2>Pending callbacks in the UI</DocsH2>
      <DocsP>
        The control panel&apos;s Callbacks tab lists every scheduled delivery
        with a live countdown, which mock triggered it, and its payload. From
        there you can fire one immediately instead of waiting out a delay,
        cancel it, or clear everything. Definitions get a Fire button too, with
        a payload editor, so you can push a webhook to your service without
        involving a mock at all. The tab also creates and edits callbacks, the
        same way it manages{" "}
        <DocsLink href="/creating-mocks/ui-mocks">UI mocks</DocsLink>;
        file-defined callbacks show as read only.
      </DocsP>

      <DocsH2>From tests and scripts</DocsH2>
      <DocsP>
        Everything the UI does goes through an HTTP API on the mock server, and
        the <DocsLink href="/sdk/getting-started">SDK</DocsLink> wraps it:
      </DocsP>
      <DocsCodeBlock language="ts">{`const pending = await mocko.fireCallback('payment-approved', { id: 'pay-42' });
await mocko.fireCallback('payment-approved', { id: 'pay-43' }, { delay: 60_000 });

await mocko.listPendingCallbacks();
await mocko.firePendingCallback(pending.id); // skip the delay
await mocko.cancelPendingCallback(pending.id);
await mocko.clearPendingCallbacks();`}</DocsCodeBlock>
      <DocsP>
        In tests, never sleep through a delay: schedule the callback, assert it
        is pending, then fire it. Manual and SDK fires are immediate by default;
        the block&apos;s <DocsCode>delay</DocsCode> only applies to
        mock-triggered callbacks.
      </DocsP>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          Because rendering happens at delivery, editing a callback&apos;s body,
          or repointing its host, affects deliveries already scheduled. If the
          definition is deleted while pending, the delivery is dropped with a
          warning in the server log.
        </li>
        <li>
          Delivery failures (connection errors, non-2xx responses) are logged
          with the callback slug and dropped. There are no automatic retries.
        </li>
        <li>
          In storeless mode, pending callbacks live in memory and are lost on
          restart. With <DocsLink href="/running/persistence">Redis</DocsLink>{" "}
          they survive restarts and are delivered exactly once across replicas,
          so long-delayed callbacks, even days out, are safe.
        </li>
        <li>
          Definitions merge like hosts: a UI-created callback with the same slug
          as a file-defined one takes precedence.
        </li>
        <li>
          <DocsCode>mocko validate</DocsCode> checks callback blocks: target
          shape, template syntax, and hosts that do not exist.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        One piece of the mock file format remains: shared fixtures. Continue to{" "}
        <DocsLink href="/creating-mocks/data-blocks">Data Blocks</DocsLink>.
      </DocsP>
    </DocsPage>
  );
}
