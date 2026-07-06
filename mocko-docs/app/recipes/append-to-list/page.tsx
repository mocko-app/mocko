import type { Metadata } from "next";
import { Callout } from "@/components/docs/callout";
import {
  DocsCode,
  DocsCodeBlock,
  DocsEyebrow,
  DocsH2,
  DocsLead,
  DocsLink,
  DocsPage,
  DocsTitle,
  DocsUl,
} from "@/components/docs/content";
import { DocsSnippet } from "@/components/docs/snippet";

export const metadata: Metadata = {
  title: "Append to a List",
  description:
    "Accept POSTed items in Mocko and return everything submitted so far with GET, using flags as an append-only store.",
};

export default function AppendToListPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Recipes</DocsEyebrow>
      <DocsTitle>Append to a List</DocsTitle>
      <DocsLead>
        Submit-and-review flows are everywhere: place an order, see it in the
        history; send an event, see it in the feed. This recipe accepts items
        with <DocsCode>POST</DocsCode> and returns everything submitted so far
        with <DocsCode>GET</DocsCode>, using{" "}
        <DocsLink href="/creating-mocks/flags">flags</DocsLink> as an
        append-only store.
      </DocsLead>

      <DocsH2>The recipe</DocsH2>
      <DocsCodeBlock language="hcl">{`mock "POST /purchases" {
  format = "json"
  body = <<-EOF
    {{= $id (uuid)}}
    {{setFlag (append 'purchases:' $id) request.body}}
    {{= $ids (getFlag 'purchases:ids')}}
    {{#if $ids}}
      {{setFlag 'purchases:ids' (append $ids ',' $id)}}
    {{else}}
      {{setFlag 'purchases:ids' $id}}
    {{/if}}
    {
      "id": "{{$id}}",
      "status": "created"
    }
  EOF
}

mock "GET /purchases" {
  format = "json"
  body = <<-EOF
    {{= $ids (getFlag 'purchases:ids')}}
    [
      {{#if $ids}}
        {{#forEach (split $ids ',')}}
          {{json (getFlag (append 'purchases:' item))}}{{^isLast}},{{/isLast}}
        {{/forEach}}
      {{/if}}
    ]
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Try it</DocsH2>
      <DocsSnippet
        command={`curl -X POST http://localhost:8080/purchases -H 'Content-Type: application/json' -d '{"product": "Widget", "qty": 2}'`}
        output={`{
  "id": "7d4c2f2e-9b1a-4f7e-8a3d-5e6f7a8b9c0d",
  "status": "created"
}`}
        className="mb-4"
      />
      <DocsSnippet
        command="curl http://localhost:8080/purchases"
        output={`[
  { "product": "Widget", "qty": 2 }
]`}
        className="mb-4"
      />

      <DocsH2>How it works</DocsH2>
      <DocsUl>
        <li>
          Every submission gets a fresh id from the <DocsCode>uuid</DocsCode>{" "}
          helper, and the whole request body is stored as an object under{" "}
          <DocsCode>purchases:&lt;id&gt;</DocsCode>.
        </li>
        <li>
          <DocsCode>purchases:ids</DocsCode> accumulates the ids as a
          comma-separated string. The first submission is the special case:
          appending to a missing flag would start the list with a comma, so the{" "}
          <DocsCode>if</DocsCode> branch sets it directly.
        </li>
        <li>
          The <DocsCode>GET</DocsCode> splits the id list back into an array,
          looks each record up, and renders it with the{" "}
          <DocsCode>json</DocsCode> helper. The surrounding{" "}
          <DocsCode>if</DocsCode> keeps the response a valid empty array before
          anything is submitted.
        </li>
        <li>
          <DocsCode>POST</DocsCode> mocks default to status{" "}
          <DocsCode>201</DocsCode>, so no <DocsCode>status</DocsCode> field is
          needed.
        </li>
      </DocsUl>
      <Callout variant="info">
        Since nothing is ever removed,{" "}
        <DocsCode>{"{{^isLast}},{{/isLast}}"}</DocsCode> is safe here. If you
        add deletion, switch the list to the accumulator pattern from{" "}
        <DocsLink href="/recipes/stateful-crud">Stateful CRUD</DocsLink>, which
        tolerates missing records.
      </Callout>

      <DocsH2>Variations</DocsH2>
      <DocsUl>
        <li>
          Add a reset mock for test isolation:{" "}
          <DocsCode>DELETE /purchases</DocsCode> with{" "}
          <DocsCode>{"{{delFlag 'purchases:ids'}}"}</DocsCode> in the body.
        </li>
        <li>
          Give entries a TTL by passing a third argument to both{" "}
          <DocsCode>setFlag</DocsCode> calls, and the feed cleans itself up
          after a while (combine with the accumulator pattern so expired records
          do not break commas).
        </li>
        <li>
          Echo the stored item back with an id in each list entry by storing a
          composed object instead of the raw body; see the id note in{" "}
          <DocsLink href="/recipes/stateful-crud">Stateful CRUD</DocsLink>.
        </li>
      </DocsUl>
    </DocsPage>
  );
}
