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
  title: "Debug Broken JSON",
  description:
    "Track down invalid JSON in Mocko responses: trailing commas from each, empty values from context changes, missing quotes, and stray braces.",
};

export default function DebugBrokenJsonPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Recipes</DocsEyebrow>
      <DocsTitle>Debug Broken JSON</DocsTitle>
      <DocsLead>
        Your mock responds, but the JSON comes back as unformatted raw text, or
        the client refuses to parse it. This page is a checklist of the four
        template bugs that cause almost every broken JSON body, in the order you
        should suspect them.
      </DocsLead>

      <DocsH2>How Mocko tells you</DocsH2>
      <DocsP>
        When a mock declares a JSON content type, Mocko validates the rendered
        body. Valid JSON is pretty-printed automatically; invalid JSON is
        returned as-is, and the server logs an error saying the body was not
        valid JSON. So an unformatted response <em>is</em> the signal: the
        template rendered something broken.
      </DocsP>

      <DocsH2>Suspect 1: a trailing comma from each</DocsH2>
      <DocsP>
        The classic. <DocsCode>isLast</DocsCode> only exists inside{" "}
        <DocsCode>forEach</DocsCode>. Inside <DocsCode>each</DocsCode> it is
        undefined, so the negated block{" "}
        <DocsCode>{"{{^isLast}},{{/isLast}}"}</DocsCode> renders its comma on{" "}
        <em>every</em> iteration, including the last:
      </DocsP>
      <DocsCodeBlock language="bigodon">{`{{! BROKEN: renders [1,2,3,] }}
[
  {{#each data.catalog.product}}
    {{$this.id}}{{^isLast}},{{/isLast}}
  {{/each}}
]

{{! FIXED: forEach provides a real isLast }}
[
  {{#forEach data.catalog.product}}
    {{item.id}}{{^isLast}},{{/isLast}}
  {{/forEach}}
]`}</DocsCodeBlock>
      <Callout variant="tip">
        Rule of thumb: any loop that produces comma-separated output, which
        means almost any JSON array, should use <DocsCode>forEach</DocsCode>.
      </Callout>

      <DocsH2>Suspect 2: an empty value from a context change</DocsH2>
      <DocsP>
        A field renders as nothing, leaving invalid JSON like{" "}
        <DocsCode>&quot;id&quot;: ,</DocsCode>. The usual cause: reading{" "}
        <DocsCode>request</DocsCode> or <DocsCode>data</DocsCode> inside a block
        that changed the context, such as <DocsCode>forEach</DocsCode>,{" "}
        <DocsCode>each</DocsCode>, <DocsCode>with</DocsCode>, or a direct object
        block:
      </DocsP>
      <DocsCodeBlock language="bigodon">{`{{! BROKEN: request is out of scope inside the loop }}
{{#forEach data.catalog.product}}
  { "id": {{item.id}}, "requestedBy": "{{request.headers.x-user}}" }{{^isLast}},{{/isLast}}
{{/forEach}}

{{! FIXED: extract to a variable first }}
{{= $user request.headers.x-user}}
{{#forEach data.catalog.product}}
  { "id": {{item.id}}, "requestedBy": "{{$user}}" }{{^isLast}},{{/isLast}}
{{/forEach}}`}</DocsCodeBlock>
      <DocsP>
        <DocsCode>$root.request...</DocsCode> also works when a variable feels
        like overkill. The mechanics are explained on the{" "}
        <DocsLink href="/creating-mocks/templating">Templating</DocsLink> page.
        A related empty-value case: reading a named data sub-block as if it were
        an object. Sub-blocks are always arrays, see{" "}
        <DocsLink href="/creating-mocks/data-blocks">Data Blocks</DocsLink>.
      </DocsP>

      <DocsH2>Suspect 3: missing quotes around a string</DocsH2>
      <DocsP>
        Template expressions render bare values; JSON string syntax is your job.{" "}
        <DocsCode>{'"name": {{item.name}}'}</DocsCode> renders{" "}
        <DocsCode>&quot;name&quot;: Widget</DocsCode>, which is not JSON. Keep
        the quotes in the template:{" "}
        <DocsCode>{'"name": "{{item.name}}"'}</DocsCode>. Numbers and booleans
        go unquoted; strings do not.
      </DocsP>

      <DocsH2>Suspect 4: literal braces</DocsH2>
      <DocsP>
        A body containing braces that are not template syntax, common when a
        payload embeds nested closing braces or example templates, fails to
        parse or renders oddly. Escape them as <DocsCode>{"\\{{"}</DocsCode> and{" "}
        <DocsCode>{"\\}}"}</DocsCode>. In HCL quoted strings (not heredocs)
        double the backslash: <DocsCode>{"\\\\{{"}</DocsCode>.
      </DocsP>

      <DocsH2>Tools for narrowing it down</DocsH2>
      <DocsUl>
        <li>
          <DocsCode>{"{{log 'here'}}"}</DocsCode> prints to the server console,
          confirming which branch ran. Dump values with{" "}
          <DocsCode>{"{{log (json request.body)}}"}</DocsCode>.
        </li>
        <li>
          Templates that fail to <em>compile</em> are reported when the mock
          loads, with a line and column pointer in the terminal, and on the mock
          itself in the UI.
        </li>
        <li>
          Bisect big templates: comment out half the body with{" "}
          <DocsCode>{"{{! ... }}"}</DocsCode> and see if the JSON becomes valid.
        </li>
      </DocsUl>
    </DocsPage>
  );
}
