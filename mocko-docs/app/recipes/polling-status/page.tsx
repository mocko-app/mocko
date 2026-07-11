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
  title: "Polling Status Flow",
  description:
    "Mock async job endpoints in Mocko that move from queued to processing to done as the client polls, using a flag as a per-job counter.",
};

export default function PollingStatusPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Recipes</DocsEyebrow>
      <DocsTitle>Polling Status Flow</DocsTitle>
      <DocsLead>
        Exports, report generation, payment confirmation: the client kicks off a
        job and polls until it finishes. A static mock cannot exercise that UI,
        because the status never changes. This recipe counts the polls with a{" "}
        <DocsLink href="/creating-mocks/flags">flag</DocsLink> and walks the job
        through its lifecycle.
      </DocsLead>

      <DocsH2>The recipe</DocsH2>
      <DocsCodeBlock language="hcl">{`mock "GET /exports/{id}" {
  format = "json"
  body = <<-EOF
    {{= $key (append 'exports:' request.params.id ':polls')}}
    {{= $count (toInt (default (getFlag $key) 0))}}
    {{setFlag $key (add $count 1)}}
    {{#lt $count 2}}
      { "id": "{{request.params.id}}", "status": "queued" }
    {{else lt $count 5}}
      { "id": "{{request.params.id}}", "status": "processing" }
    {{else}}
      {
        "id": "{{request.params.id}}",
        "status": "done",
        "url": "https://files.example.com/export-{{request.params.id}}.csv"
      }
    {{/lt}}
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Try it</DocsH2>
      <DocsSnippet
        command="curl http://localhost:8080/exports/7"
        output={`{
  "id": 7,
  "status": "queued"
}`}
        className="mb-4"
      />
      <DocsP>
        Keep polling: requests three through five report{" "}
        <DocsCode>processing</DocsCode>, and from the sixth on the export is{" "}
        <DocsCode>done</DocsCode> with a download URL.
      </DocsP>

      <DocsH2>How it works</DocsH2>
      <DocsUl>
        <li>
          Each job id gets its own counter flag,{" "}
          <DocsCode>exports:&lt;id&gt;:polls</DocsCode>, so two jobs polled in
          parallel advance independently.
        </li>
        <li>
          <DocsCode>default (getFlag $key) 0</DocsCode> makes the first poll
          start from zero, and <DocsCode>setFlag</DocsCode> increments before
          the branching, one count per request.
        </li>
        <li>
          The <DocsCode>lt</DocsCode> chain with{" "}
          <DocsCode>{"{{else lt ...}}"}</DocsCode> maps count ranges to
          lifecycle stages. Widen the ranges to make the job feel slower.
        </li>
      </DocsUl>
      <Callout variant="warning">
        The counter is state, so the job stays <DocsCode>done</DocsCode> forever
        once finished. Reset it to run the flow again: delete the flag in the
        flags panel, or add the reset mock below.
      </Callout>
      <DocsCodeBlock language="hcl">{`mock "DELETE /exports/{id}/polls" {
  format = "json"
  body = <<-EOF
    {{delFlag (append 'exports:' request.params.id ':polls')}}
    { "reset": true }
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Variations</DocsH2>
      <DocsUl>
        <li>
          <strong className="text-foreground">Self-resetting jobs:</strong> pass
          a TTL as <DocsCode>setFlag</DocsCode>&apos;s third argument,{" "}
          <DocsCode>{"{{setFlag $key (add $count 1) 60000}}"}</DocsCode>, and an
          untouched job forgets its progress after a minute.
        </li>
        <li>
          <strong className="text-foreground">Failure endings:</strong> add an{" "}
          <DocsCode>{"{{else}}"}</DocsCode> stage that returns{" "}
          <DocsCode>status: &quot;failed&quot;</DocsCode> for counts past a
          threshold, or roll <DocsCode>random</DocsCode> into the final branch
          for a chance of failure, as in{" "}
          <DocsLink href="/recipes/slow-unstable-apis">
            Simulate Slow or Unstable APIs
          </DocsLink>
          .
        </li>
        <li>
          <strong className="text-foreground">
            Time-based instead of poll-based:
          </strong>{" "}
          store a timestamp on the first poll and branch on{" "}
          <DocsCode>dateDiff</DocsCode> so the job finishes after real seconds
          rather than a number of requests.
        </li>
      </DocsUl>
    </DocsPage>
  );
}
