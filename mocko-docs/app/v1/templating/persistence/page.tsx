import type { Metadata } from "next";
import { LegacyBanner } from "@/components/docs/legacy-banner";
import {
  DocsCode,
  DocsCodeBlock,
  DocsH2,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = { title: "Persistence (v1)" };

export default function V1PersistencePage() {
  return (
    <DocsPage>
      <LegacyBanner v2href="/reference/helpers" />
      <DocsTitle>Persistence</DocsTitle>
      <DocsP>
        Mocko allows you to use Flags: values that persist between requests, or
        even between restarts when Redis is enabled. Redis is on by default in
        the complete stack and off by default in standalone mode (falls back to
        in-memory).
      </DocsP>

      <DocsH2>Getting started</DocsH2>
      <DocsP>
        Create a <DocsCode>PUT /message/{"{message}"}</DocsCode> that saves a
        flag and a <DocsCode>GET /message</DocsCode> that returns it:
      </DocsP>
      <DocsCodeBlock>{`mock "PUT /message/{message}" {
  body = <<EOF
    {{! Setting the flag 'msg' to the value of the 'message' param }}
    {{setFlag 'msg' request.params.message}}
  EOF
}

mock "GET /message" {
  body = <<EOF
    {{getFlag 'msg'}}
  EOF
}`}</DocsCodeBlock>
      <DocsP>Set the message:</DocsP>
      <DocsCodeBlock>{`$ curl -X PUT http://localhost:8080/message/potato`}</DocsCodeBlock>
      <DocsP>Get the message back:</DocsP>
      <DocsCodeBlock>{`$ curl http://localhost:8080/message
potato`}</DocsCodeBlock>

      <DocsH2>More helpers</DocsH2>
      <DocsP>
        You can also check whether a flag exists and delete it. Here is the
        previous example extended with <DocsCode>hasFlag</DocsCode> and{" "}
        <DocsCode>delFlag</DocsCode>:
      </DocsP>
      <DocsCodeBlock>{`mock "PUT /message/{message}" {
  body = "{{setFlag 'msg' request.params.message}}"
}

mock "GET /message" {
  body = <<EOF
    {{#hasFlag 'msg'}}
      {{getFlag 'msg'}}
    {{else}}
      {{setStatus 404}}
      No message is set
    {{/hasFlag}}
  EOF
}

mock "DELETE /message" {
  body = "{{delFlag 'msg'}}"
}`}</DocsCodeBlock>
      <DocsP>Delete the flag:</DocsP>
      <DocsCodeBlock>{`$ curl -X DELETE http://localhost:8080/message`}</DocsCodeBlock>
      <DocsP>Now GET returns 404:</DocsP>
      <DocsCodeBlock>{`$ curl -D - http://localhost:8080/message

HTTP/1.1 404 Not Found
No message is set`}</DocsCodeBlock>

      <DocsH2>Dynamic flags</DocsH2>
      <DocsP>
        Use request data to build a flag&apos;s name so you can store multiple
        resources. The <DocsCode>:</DocsCode> separator renders as folder groups
        in the UI:
      </DocsP>
      <DocsCodeBlock>{`mock "POST /users" {
  headers {
    Content-Type = "application/json"
  }
  body = <<EOF
    {{set 'id' (uuid)}}
    {{setFlag (append 'users:' (get 'id') ':name') request.body.name}}
    {{setFlag (append 'users:' (get 'id') ':age') request.body.age}}
    {
      "id": "{{get 'id'}}"
    }
  EOF
}

mock "GET /users/{id}" {
  body = <<EOF
    {{#hasFlag (append 'users:' request.params.id ':name')}}
      Hello! My name is {{getFlag (append 'users:' request.params.id ':name')}}
      and I'm {{getFlag (append 'users:' request.params.id ':age')}} years old
    {{else}}
      {{setStatus 404}}
    {{/hasFlag}}
  EOF
}`}</DocsCodeBlock>
      <DocsP>Create a user:</DocsP>
      <DocsCodeBlock>{`$ curl -X POST http://localhost:8080/users \\
  -d '{"name": "George", "age": 95}' \\
  -H 'Content-Type: application/json'
{
  "id": "8dfad38d-56e9-4210-8dfa-1c8f9da213f2"
}`}</DocsCodeBlock>
      <DocsP>Retrieve by ID:</DocsP>
      <DocsCodeBlock>{`$ curl http://localhost:8080/users/8dfad38d-56e9-4210-8dfa-1c8f9da213f2
Hello! My name is George
and I'm 95 years old`}</DocsCodeBlock>
      <DocsP>
        Each user gets a unique UUID-based key, so creating a new user never
        overwrites an existing one.
      </DocsP>
    </DocsPage>
  );
}
