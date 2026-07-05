import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/docs/callout";
import {
  DocsCode,
  DocsCodeBlock,
  DocsEyebrow,
  DocsH2,
  DocsLead,
  DocsP,
  DocsPage,
  DocsTitle,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Templating",
  description:
    "Use Bigodon templates in Mocko response bodies to read request data, branch, loop, and render dynamic responses.",
};

export default function TemplatingPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>Templating</DocsTitle>
      <DocsLead>
        Mocko response bodies use Bigodon, a Handlebars-like template language
        with helpers, variables, conditionals, and async Mocko helpers.
      </DocsLead>

      <DocsH2>Read the request</DocsH2>
      <DocsP>
        Templates receive the request and shared data as context. Request
        headers are available with lowercase names.
      </DocsP>
      <DocsCodeBlock>{`{
  "id": {{request.params.id}},
  "page": "{{request.query.page}}",
  "token": "{{request.headers.x-token}}",
  "name": "{{request.body.name}}"
}`}</DocsCodeBlock>

      <DocsH2>Branch inside a response</DocsH2>
      <DocsCodeBlock>{`{{#is request.query.includeEmpty "true"}}
  []
{{else}}
  {{setStatus 404}}
  { "error": "Not found" }
{{/is}}`}</DocsCodeBlock>

      <DocsH2>Use variables before loops</DocsH2>
      <DocsP>
        Blocks such as <DocsCode>forEach</DocsCode>, <DocsCode>each</DocsCode>,
        and <DocsCode>with</DocsCode> change the current context. Store request
        values in variables before entering the block, or use{" "}
        <DocsCode>$root</DocsCode>.
      </DocsP>
      <DocsCodeBlock>{`{{= $id request.params.id}}
{{= $found false}}
{{#forEach data.products.product}}
  {{#is item.id $id}}
    {{= $found true}}
    {{item.content}}
  {{/is}}
{{/forEach}}
{{#unless $found}}
  {{setStatus 404}}
  { "error": "Not found" }
{{/unless}}`}</DocsCodeBlock>

      <Callout variant="tip">
        Use <DocsCode>forEach</DocsCode> when rendering JSON arrays. It exposes{" "}
        <DocsCode>item</DocsCode>, <DocsCode>index</DocsCode>,{" "}
        <DocsCode>isFirst</DocsCode>, and <DocsCode>isLast</DocsCode>.
      </Callout>

      <DocsH2>JSON output</DocsH2>
      <DocsP>
        When a rendered body is valid JSON, Mocko pretty-prints it and sets{" "}
        <DocsCode>Content-Type: application/json</DocsCode> if no content type
        was declared. Invalid JSON is returned as raw text and logged.
      </DocsP>

      <DocsH2>Reference</DocsH2>
      <DocsP>
        See{" "}
        <Link
          href="/docs/reference/bigodon"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Bigodon syntax
        </Link>{" "}
        and{" "}
        <Link
          href="/docs/reference/helpers"
          className="underline underline-offset-4 hover:text-foreground"
        >
          template helpers
        </Link>{" "}
        for lookup tables.
      </DocsP>
    </DocsPage>
  );
}
