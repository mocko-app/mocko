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
  title: "Stateful CRUD",
  description:
    "Build a complete create, read, update, and delete API in Mocko using flags as the data store, with real 404s and a consistent list endpoint.",
};

export default function StatefulCrudPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Recipes</DocsEyebrow>
      <DocsTitle>Stateful CRUD</DocsTitle>
      <DocsLead>
        A frontend under development usually needs more than canned responses:
        it needs to create a resource, see it in the list, edit it, and delete
        it. This recipe builds a complete users API on top of{" "}
        <DocsLink href="/creating-mocks/flags">flags</DocsLink>, with real 404
        behavior and no backend at all.
      </DocsLead>

      <DocsH2>The recipe</DocsH2>
      <DocsCodeBlock language="hcl">{`mock "POST /users" {
  format = "json"
  body = <<-EOF
    {{= $id (uuid)}}
    {{setFlag (append 'users:' $id) request.body}}
    {{= $ids (getFlag 'users:ids')}}
    {{#if $ids}}
      {{setFlag 'users:ids' (append $ids ',' $id)}}
    {{else}}
      {{setFlag 'users:ids' $id}}
    {{/if}}
    { "id": "{{$id}}" }
  EOF
}

mock "GET /users" {
  format = "json"
  body = <<-EOF
    {{= $ids (getFlag 'users:ids')}}
    {{= $out ''}}
    {{#if $ids}}
      {{#forEach (split $ids ',')}}
        {{#hasFlag (append 'users:' item)}}
          {{#if $out}}{{= $out (append $out ',')}}{{/if}}
          {{= $out (append $out (json (getFlag (append 'users:' item))))}}
        {{/hasFlag}}
      {{/forEach}}
    {{/if}}
    [{{$out}}]
  EOF
}

mock "GET /users/{id}" {
  format = "json"
  body = <<-EOF
    {{= $key (append 'users:' request.params.id)}}
    {{#hasFlag $key}}
      {{json (getFlag $key)}}
    {{else}}
      {{setStatus 404}}
      { "error": "User not found" }
    {{/hasFlag}}
  EOF
}

mock "PUT /users/{id}" {
  format = "json"
  body = <<-EOF
    {{= $key (append 'users:' request.params.id)}}
    {{#hasFlag $key}}
      {{setFlag $key request.body}}
      {{json request.body}}
    {{else}}
      {{setStatus 404}}
      { "error": "User not found" }
    {{/hasFlag}}
  EOF
}

mock "DELETE /users/{id}" {
  format = "json"
  body = <<-EOF
    {{delFlag (append 'users:' request.params.id)}}
    { "deleted": true }
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Try it</DocsH2>
      <DocsSnippet
        command={`curl -X POST http://localhost:8080/users -H 'Content-Type: application/json' -d '{"name": "Alice", "email": "alice@example.com"}'`}
        output={`{
  "id": "1c9e1e21-7a83-4d6e-9f42-2b2f6a3f8b0d"
}`}
        className="mb-4"
      />
      <DocsSnippet
        command="curl http://localhost:8080/users"
        output={`[
  { "name": "Alice", "email": "alice@example.com" }
]`}
        className="mb-4"
      />
      <DocsP>
        Update with <DocsCode>PUT</DocsCode>, delete with{" "}
        <DocsCode>DELETE</DocsCode> (your generated id will differ), and the
        list and detail endpoints follow along, including a{" "}
        <DocsCode>404</DocsCode> after deletion.
      </DocsP>

      <DocsH2>How it works</DocsH2>
      <DocsUl>
        <li>
          Each record is one flag: <DocsCode>users:&lt;id&gt;</DocsCode> stores
          the submitted body as an object, written with{" "}
          <DocsCode>setFlag</DocsCode> and rendered back with the{" "}
          <DocsCode>json</DocsCode> helper.
        </li>
        <li>
          <DocsCode>users:ids</DocsCode> keeps a comma-separated list of ids,
          which is what makes the list endpoint possible. The{" "}
          <DocsCode>POST</DocsCode> appends to it, treating the empty case
          separately because <DocsCode>append</DocsCode> on a missing value
          would produce a leading comma.
        </li>
        <li>
          The list endpoint splits the id list, skips ids whose record flag no
          longer exists (deleted users), and accumulates the JSON into the{" "}
          <DocsCode>$out</DocsCode> variable, adding commas only between
          elements. Accumulation is used instead of{" "}
          <DocsCode>{"{{^isLast}},{{/isLast}}"}</DocsCode> because the last id
          in the list might be a deleted record, which would leave a trailing
          comma.
        </li>
        <li>
          <DocsCode>hasFlag</DocsCode> guards the detail and update endpoints,
          turning missing records into <DocsCode>404</DocsCode>s with{" "}
          <DocsCode>setStatus</DocsCode>.
        </li>
      </DocsUl>
      <Callout variant="info">
        Deleting a user removes the record flag but leaves its id in{" "}
        <DocsCode>users:ids</DocsCode>. The list endpoint tolerates the stale
        id, so nothing breaks; the ids flag just grows over time. Delete it in
        the flags panel or with a reset mock when you want a clean slate.
      </Callout>

      <DocsH2>Variations</DocsH2>
      <DocsUl>
        <li>
          The stored record is exactly the submitted body, so responses do not
          include the generated id. If your client expects it, render the fields
          explicitly:{" "}
          <DocsCode>
            {
              '{ "id": "{{request.params.id}}", "name": "{{pick (getFlag $key) \'name\'}}" }'
            }
          </DocsCode>
          .
        </li>
        <li>
          Add a reset endpoint for test suites: a{" "}
          <DocsCode>DELETE /users</DocsCode> mock that calls{" "}
          <DocsCode>{"{{delFlag 'users:ids'}}"}</DocsCode>.
        </li>
        <li>
          On a storeless instance all of this state disappears on restart, which
          is often exactly what you want locally. Run with Redis when the data
          should survive; see{" "}
          <DocsLink href="/running/persistence">Persistence and Redis</DocsLink>
          .
        </li>
      </DocsUl>

      <DocsH2>Related</DocsH2>
      <DocsP>
        For a read-only collection served from fixtures instead of runtime
        state, use{" "}
        <DocsLink href="/recipes/list-and-detail">
          List and Detail From Data
        </DocsLink>
        . For accumulating submissions without update and delete, the simpler{" "}
        <DocsLink href="/recipes/append-to-list">Append to a List</DocsLink>{" "}
        recipe is enough.
      </DocsP>
    </DocsPage>
  );
}
