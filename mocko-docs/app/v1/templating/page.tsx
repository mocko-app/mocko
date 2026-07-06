import type { Metadata } from "next";
import Link from "next/link";
import { LegacyBanner } from "@/components/docs/legacy-banner";
import {
  DocsCode,
  DocsCodeBlock,
  DocsH2,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = { title: "Templating (v1)" };

export default function V1TemplatingPage() {
  return (
    <DocsPage>
      <LegacyBanner v2href="/creating-mocks/templating" />
      <DocsTitle>Templating</DocsTitle>
      <DocsP>
        Templating is where Mocko really shines: it lets you create dynamic
        mocks and simulate complicated scenarios with ease. You can use
        templating in any installation of Mocko: standalone mode, complete
        stack, or hybrid.
      </DocsP>
      <DocsP>
        Templates go in the <DocsCode>body</DocsCode> parameter of the{" "}
        <DocsCode>mock</DocsCode> stanza in standalone mode, or in the Body
        field in the UI.
      </DocsP>

      <DocsH2>Handlebars</DocsH2>
      <DocsP>
        Mocko uses{" "}
        <a
          href="https://handlebarsjs.com"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Handlebars
        </a>{" "}
        as its templating language. In a{" "}
        <DocsCode>GET /cats/{"{name}"}</DocsCode> mock, this template:
      </DocsP>
      <DocsCodeBlock language="bigodon">{`{
  "id": 1,
  "name": "{{ request.params.name }}"
}`}</DocsCodeBlock>
      <DocsP>
        Produces this response on <DocsCode>GET /cats/george</DocsCode>:
      </DocsP>
      <DocsCodeBlock language="json">{`{
  "id": 1,
  "name": "george"
}`}</DocsCodeBlock>
      <DocsP>
        You can also use helpers from{" "}
        <a
          href="https://github.com/helpers/handlebars-helpers"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          handlebars-helpers
        </a>
        :
      </DocsP>
      <DocsCodeBlock language="bigodon">{`{
  "id": 1,
  "name": "{{capitalizeAll request.params.name }}"
}`}</DocsCodeBlock>

      <DocsH2>Context</DocsH2>
      <DocsP>Fields available in every template:</DocsP>
      <ul className="mb-4 list-disc space-y-1.5 pl-6 text-[14px] text-fg-2">
        <li>
          <DocsCode>request.params</DocsCode>: URL params defined in the path
        </li>
        <li>
          <DocsCode>request.headers</DocsCode>: request headers
        </li>
        <li>
          <DocsCode>request.query</DocsCode>: query string parameters
        </li>
        <li>
          <DocsCode>request.body</DocsCode>: request body fields (JSON)
        </li>
      </ul>

      <DocsH2>Blocks</DocsH2>
      <DocsP>
        Block helpers let you write conditionals and loops. Open with{" "}
        <DocsCode>#</DocsCode> and close with <DocsCode>/</DocsCode>. Blocks
        support <DocsCode>else</DocsCode> and can be nested using parentheses:
      </DocsP>
      <DocsCodeBlock language="bigodon">{`{{#startsWith 'g' (downcase request.params.name) }}
  {
    "id": 1,
    "name": "{{capitalizeAll request.params.name }}"
  }
{{else}}
  {{setStatus 404}}
  {
    "error": "Not found error",
    "message": "Cat not found"
  }
{{/startsWith}}`}</DocsCodeBlock>
      <DocsP>
        The <DocsCode>setStatus</DocsCode> helper changes the response status
        dynamically. Comments use <DocsCode>{"{{! ... }}"}</DocsCode>.
      </DocsP>

      <DocsH2>Logging</DocsH2>
      <DocsP>
        Use the <DocsCode>log</DocsCode> helper to log to Mocko&apos;s console:
      </DocsP>
      <DocsCodeBlock language="bigodon">{`{{log 'Received a request for cat id ' request.params.id }}
{{log (JSONstringify request)}}`}</DocsCodeBlock>

      <DocsH2>Next steps</DocsH2>
      <DocsP>
        See{" "}
        <Link
          href="/v1/templating/helpers"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Helpers
        </Link>{" "}
        for Mocko-specific helpers, or{" "}
        <Link
          href="/v1/templating/persistence"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Persistence
        </Link>{" "}
        for stateful flags.
      </DocsP>
    </DocsPage>
  );
}
