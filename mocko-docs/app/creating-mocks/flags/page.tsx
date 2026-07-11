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
  DocsScreenshot,
} from "@/components/docs/content";
import { DocsSnippet } from "@/components/docs/snippet";

export const metadata: Metadata = {
  title: "Flags",
  description:
    "Give Mocko mocks state that survives across requests with flags: setFlag, getFlag, hasFlag, delFlag, key organization, TTLs, and persistence.",
};

export default function FlagsPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>Flags</DocsTitle>
      <DocsLead>
        Flags are key-value state that survives across requests. They are what
        turn Mocko from a canned-response server into something that can
        simulate real behavior: toggling an outage, remembering an update,
        walking a job through its statuses. By the end of this page you will
        know all four flag helpers and how to organize flag keys.
      </DocsLead>

      <DocsH2>A switchable outage</DocsH2>
      <DocsP>
        The fastest way to understand flags is to build a switch. One mock flips
        it, another changes behavior based on it:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "POST /outage/{state}" {
  format = "json"
  body = <<-EOF
    {{#is request.params.state 'on'}}
      {{setFlag 'outage' true}}
    {{else}}
      {{delFlag 'outage'}}
    {{/is}}
    { "outage": "{{request.params.state}}" }
  EOF
}

mock "GET /payments/{id}" {
  format = "json"
  body = <<-EOF
    {{#hasFlag 'outage'}}
      {{setStatus 503}}
      { "error": "Payment provider unavailable" }
    {{else}}
      { "id": "{{request.params.id}}", "status": "approved" }
    {{/hasFlag}}
  EOF
}`}</DocsCodeBlock>
      <DocsSnippet
        command="curl http://localhost:8080/payments/9"
        output={`{
  "id": 9,
  "status": "approved"
}`}
        className="mb-4"
      />
      <DocsSnippet
        command="curl -X POST http://localhost:8080/outage/on"
        output={`{
  "outage": "on"
}`}
        className="mb-4"
      />
      <DocsSnippet
        command="curl -i http://localhost:8080/payments/9"
        output={`HTTP/1.1 503 Service Unavailable
...
{
  "error": "Payment provider unavailable"
}`}
        className="mb-4"
      />
      <DocsP>
        The state changed between two identical requests. That is the whole
        point of flags, and it works because flags are shared by all mocks on
        the instance and persist until deleted or expired.
      </DocsP>

      <DocsH2>The four helpers</DocsH2>
      <DocsUl>
        <li>
          <DocsCode>{"{{setFlag 'key' value}}"}</DocsCode> stores a value.
          Renders nothing. An optional third argument sets a TTL in
          milliseconds: <DocsCode>{"{{setFlag 'otp' 1234 60000}}"}</DocsCode>{" "}
          expires after a minute.
        </li>
        <li>
          <DocsCode>{"{{getFlag 'key'}}"}</DocsCode> reads a value. An unset
          flag renders as an empty string, so pair it with{" "}
          <DocsCode>default</DocsCode> when you need a fallback:{" "}
          <DocsCode>{"{{default (getFlag 'name') 'John'}}"}</DocsCode>.
        </li>
        <li>
          <DocsCode>{"{{hasFlag 'key'}}"}</DocsCode> returns true or false, made
          for block position:{" "}
          <DocsCode>{"{{#hasFlag 'outage'}}...{{/hasFlag}}"}</DocsCode>.
        </li>
        <li>
          <DocsCode>{"{{delFlag 'key'}}"}</DocsCode> deletes a flag. Renders
          nothing.
        </li>
      </DocsUl>
      <Callout variant="warning">
        Flags persist across requests; <DocsCode>$variables</DocsCode> reset on
        every request. If you only need a value within one response, use a
        variable. Reaching for <DocsCode>setFlag</DocsCode> as a template-local
        temporary is a classic mistake: the value will still be there on the
        next request.
      </Callout>

      <DocsH2>Organizing keys</DocsH2>
      <DocsP>
        Flag keys are plain strings, and a <DocsCode>:</DocsCode> separator
        gives them structure: the Mocko UI displays{" "}
        <DocsCode>users:42:name</DocsCode> as nested folders,{" "}
        <DocsCode>users / 42 / name</DocsCode>. Build keys dynamically with{" "}
        <DocsCode>append</DocsCode> and store them in a variable so each key is
        written once:
      </DocsP>
      <DocsCodeBlock language="bigodon">{`{{= $nameKey (append 'users:' request.params.id ':name')}}
{{setFlag $nameKey request.body.name}}
"{{getFlag $nameKey}}"`}</DocsCodeBlock>

      <DocsH2>Remembering an update</DocsH2>
      <DocsP>
        Put those pieces together and a pair of mocks can simulate a mutable
        resource. The <DocsCode>PUT</DocsCode> stores the new values, and the{" "}
        <DocsCode>GET</DocsCode> serves them with defaults until an update
        happens:
      </DocsP>
      <DocsCodeBlock language="hcl">{`mock "PUT /users/{id}" {
  format = "json"
  body = <<-EOF
    {{= $nameKey  (append 'users:' request.params.id ':name')}}
    {{= $emailKey (append 'users:' request.params.id ':email')}}
    {{setFlag $nameKey  request.body.name}}
    {{setFlag $emailKey request.body.email}}
    {
      "id": "{{request.params.id}}",
      "name": "{{getFlag $nameKey}}",
      "email": "{{getFlag $emailKey}}"
    }
  EOF
}

mock "GET /users/{id}" {
  format = "json"
  body = <<-EOF
    {{= $nameKey  (append 'users:' request.params.id ':name')}}
    {{= $emailKey (append 'users:' request.params.id ':email')}}
    {
      "id": "{{request.params.id}}",
      "name": "{{default (getFlag $nameKey) 'John Doe'}}",
      "email": "{{default (getFlag $emailKey) 'john@example.com'}}"
    }
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        This pattern scales into full create-read-update-delete simulations; the{" "}
        <DocsLink href="/recipes/stateful-crud">Stateful CRUD</DocsLink> recipe
        builds the complete version.
      </DocsP>

      <DocsH2>Flags in the UI</DocsH2>
      <DocsP>
        The control panel has a flags section where you can browse the folder
        tree, inspect values, edit them, and delete them. Editing a flag from
        the UI is often the quickest way to steer a scenario mid-test: flip the
        value and the very next request sees it.
      </DocsP>
      <DocsScreenshot
        src="https://cdn.codetunnel.net/mocko/flags-folders.png"
        alt="The flags panel showing folders for users, reports, and orders next to a root-level maintenance-mode flag"
      />

      <DocsH2>Flags from outside the instance</DocsH2>
      <DocsP>
        Flags are also exposed through a small HTTP API on the mock server
        itself, and Mocko ships a zero-dependency JavaScript SDK on top of it.
        That is how automated tests set up scenarios: the test sets a flag,
        calls the system under test, and asserts on the result. See{" "}
        <DocsLink href="/sdk/getting-started">Testing with the SDK</DocsLink>.
      </DocsP>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          In the default storeless mode, flags live in memory and reset when
          Mocko stops. With Redis they persist across restarts and are shared
          between replicas. See{" "}
          <DocsLink href="/running/persistence">Persistence and Redis</DocsLink>
          .
        </li>
        <li>
          Flags are instance-wide. Two developers hitting a shared Mocko
          deployment see the same flags, which is a feature for team scenarios
          and something to keep in mind for parallel test runs: prefix keys with
          something unique per run when isolation matters.
        </li>
        <li>
          <DocsCode>setFlag</DocsCode> can store objects, such as{" "}
          <DocsCode>request.body</DocsCode>. Render one back with the{" "}
          <DocsCode>json</DocsCode> helper:{" "}
          <DocsCode>{"{{json (getFlag 'user')}}"}</DocsCode>.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        Mocks and state cover the fake side. Continue to{" "}
        <DocsLink href="/creating-mocks/proxying-and-hosts">
          Proxying and Hosts
        </DocsLink>{" "}
        to blend mocks with real backends.
      </DocsP>
    </DocsPage>
  );
}
