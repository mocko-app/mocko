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
  DocsTable,
  DocsTbody,
  DocsTd,
  DocsTh,
  DocsThead,
  DocsTitle,
  DocsUl,
} from "@/components/docs/content";

export const metadata: Metadata = {
  title: "Bigodon",
  description:
    "Reference for the Bigodon template language used in Mocko mock bodies: syntax, blocks, variables, and the most-used built-in helpers.",
};

export default function ReferenceBigodonPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Reference</DocsEyebrow>
      <DocsTitle>Bigodon</DocsTitle>
      <DocsLead>
        Bigodon is the Handlebars-like language mock bodies are written in. This
        page is the syntax reference plus the built-in helpers you will actually
        reach for; the exhaustive helper list lives in the{" "}
        <DocsLink
          href="https://github.com/mocko-app/bigodon"
          target="_blank"
          rel="noreferrer"
        >
          Bigodon repository
        </DocsLink>
        .
      </DocsLead>

      <DocsH2>Syntax</DocsH2>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Construct</DocsTh>
            <DocsTh>Syntax</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>Path expression</DocsTd>
            <DocsTd>
              <DocsCode>{"{{user.name}}"}</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Helper call</DocsTd>
            <DocsTd>
              <DocsCode>{"{{capitalize name}}"}</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Nested helpers</DocsTd>
            <DocsTd>
              <DocsCode>{"{{default (capitalize name) 'stranger'}}"}</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Named parameters</DocsTd>
            <DocsTd>
              <DocsCode>{"{{helper arg name=value}}"}</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Comment</DocsTd>
            <DocsTd>
              <DocsCode>{"{{! ignored }}"}</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Variable assignment</DocsTd>
            <DocsTd>
              <DocsCode>{"{{= $var value}}"}</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Variable read</DocsTd>
            <DocsTd>
              <DocsCode>{"{{$var}}"}</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Block</DocsTd>
            <DocsTd>
              <DocsCode>{"{{#expr}}...{{/expr}}"}</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Negated block</DocsTd>
            <DocsTd>
              <DocsCode>{"{{^expr}}...{{/expr}}"}</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Else</DocsTd>
            <DocsTd>
              <DocsCode>{"{{else}}"}</DocsCode> or{" "}
              <DocsCode>{"{{else helper args}}"}</DocsCode> for chains
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Current item / parents</DocsTd>
            <DocsTd>
              <DocsCode>$this</DocsCode>, <DocsCode>$parent</DocsCode>{" "}
              (chainable), <DocsCode>$root</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Escaped braces</DocsTd>
            <DocsTd>
              <DocsCode>{"\\{{"}</DocsCode> and <DocsCode>{"\\}}"}</DocsCode>{" "}
              render literal braces
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>
      <DocsUl>
        <li>
          String literals accept single, double, or backtick quotes. Spaces
          inside <DocsCode>{"{{ }}"}</DocsCode> are optional.
        </li>
        <li>
          No space is allowed between <DocsCode>{"{{"}</DocsCode> and{" "}
          <DocsCode>#</DocsCode>, <DocsCode>^</DocsCode>, or{" "}
          <DocsCode>/</DocsCode>.
        </li>
        <li>
          There is no HTML escaping and no triple-stash:{" "}
          <DocsCode>{"{{value}}"}</DocsCode> renders values as-is.
        </li>
      </DocsUl>

      <DocsH2>Blocks and context</DocsH2>
      <DocsP>
        A block over an array iterates it; a block over an object makes it the
        context; helpers like <DocsCode>if</DocsCode> and comparison blocks do
        not change context at all:
      </DocsP>
      <DocsCodeBlock language="bigodon">{`{{#is status 'active'}}Active{{else is status 'pending'}}Pending{{else}}Unknown{{/is}}

{{#forEach items}}
  {{index}}: {{item.name}}{{^isLast}},{{/isLast}}
{{/forEach}}`}</DocsCodeBlock>
      <DocsUl>
        <li>
          <DocsCode>forEach</DocsCode> provides{" "}
          <DocsCode>{"{item, index, total, isFirst, isLast}"}</DocsCode>;{" "}
          <DocsCode>each</DocsCode> makes each element the context and provides
          none of those. In mock bodies producing JSON arrays, prefer{" "}
          <DocsCode>forEach</DocsCode>.
        </li>
        <li>In chained else-if blocks, close only the outermost helper.</li>
        <li>
          Blocks work on helper calls and context paths, not variables: use{" "}
          <DocsCode>{"{{#if $var}}"}</DocsCode> /{" "}
          <DocsCode>{"{{#unless $var}}"}</DocsCode> for variables.
        </li>
        <li>
          Variables are global within a request: assignments inside blocks
          persist outside, which enables accumulator patterns.
        </li>
      </DocsUl>

      <DocsH2>Most-used helpers</DocsH2>
      <DocsP>
        A curated subset by category. Aliases exist for many (for example{" "}
        <DocsCode>lower</DocsCode> / <DocsCode>downcase</DocsCode>); the{" "}
        <DocsLink
          href="https://github.com/mocko-app/bigodon"
          target="_blank"
          rel="noreferrer"
        >
          repository
        </DocsLink>{" "}
        lists every helper and alias.
      </DocsP>
      <DocsTable>
        <DocsThead>
          <tr>
            <DocsTh>Category</DocsTh>
            <DocsTh>Helpers</DocsTh>
          </tr>
        </DocsThead>
        <DocsTbody>
          <tr>
            <DocsTd>Comparison</DocsTd>
            <DocsTd>
              <DocsCode>is</DocsCode> (loose ==, coerces strings to numbers),{" "}
              <DocsCode>eq</DocsCode> (strict ===), <DocsCode>gt</DocsCode>,{" "}
              <DocsCode>gte</DocsCode>, <DocsCode>lt</DocsCode>,{" "}
              <DocsCode>lte</DocsCode>, <DocsCode>and</DocsCode>,{" "}
              <DocsCode>or</DocsCode>, <DocsCode>not</DocsCode>,{" "}
              <DocsCode>default</DocsCode>, <DocsCode>if</DocsCode>,{" "}
              <DocsCode>unless</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>String</DocsTd>
            <DocsTd>
              <DocsCode>append</DocsCode>, <DocsCode>uppercase</DocsCode>,{" "}
              <DocsCode>lowercase</DocsCode>, <DocsCode>capitalize</DocsCode>,{" "}
              <DocsCode>startsWith</DocsCode>, <DocsCode>endsWith</DocsCode>,{" "}
              <DocsCode>replace</DocsCode>, <DocsCode>trim</DocsCode>,{" "}
              <DocsCode>split</DocsCode>, <DocsCode>json</DocsCode>,{" "}
              <DocsCode>uuid</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Math</DocsTd>
            <DocsTd>
              <DocsCode>add</DocsCode>, <DocsCode>subtract</DocsCode>,{" "}
              <DocsCode>multiply</DocsCode>, <DocsCode>divide</DocsCode>,{" "}
              <DocsCode>modulo</DocsCode>, <DocsCode>toInt</DocsCode>,{" "}
              <DocsCode>toFixed</DocsCode>, <DocsCode>round</DocsCode>,{" "}
              <DocsCode>random</DocsCode> (inclusive on both ends)
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Array</DocsTd>
            <DocsTd>
              <DocsCode>forEach</DocsCode>, <DocsCode>each</DocsCode>,{" "}
              <DocsCode>length</DocsCode>, <DocsCode>itemAt</DocsCode> (the only
              index access; no <DocsCode>arr[0]</DocsCode>),{" "}
              <DocsCode>first</DocsCode>, <DocsCode>last</DocsCode>,{" "}
              <DocsCode>slice</DocsCode>, <DocsCode>includes</DocsCode>,{" "}
              <DocsCode>join</DocsCode>, <DocsCode>pluck</DocsCode>,{" "}
              <DocsCode>sort</DocsCode>, <DocsCode>unique</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Object</DocsTd>
            <DocsTd>
              <DocsCode>pick</DocsCode> (string-key access; also the only way to
              read keys containing dots, and to read fields off helper results),{" "}
              <DocsCode>object</DocsCode> (builds an object from named
              parameters)
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Date</DocsTd>
            <DocsTd>
              <DocsCode>now</DocsCode>, <DocsCode>date</DocsCode>,{" "}
              <DocsCode>dateAdd</DocsCode>, <DocsCode>dateSub</DocsCode>,{" "}
              <DocsCode>dateIso</DocsCode>, <DocsCode>dateTimestamp</DocsCode>,{" "}
              <DocsCode>dateDiff</DocsCode>
            </DocsTd>
          </tr>
          <tr>
            <DocsTd>Control</DocsTd>
            <DocsTd>
              <DocsCode>with</DocsCode>, <DocsCode>typeof</DocsCode>,{" "}
              <DocsCode>return</DocsCode> (halt and return what rendered so far)
            </DocsTd>
          </tr>
        </DocsTbody>
      </DocsTable>

      <DocsH2>Named parameters</DocsH2>
      <DocsP>
        Helpers accept <DocsCode>name=value</DocsCode> pairs after all
        positional arguments. Values can be literals, context paths, variables,
        or parenthesized expressions. Helpers that do not use a named parameter
        silently ignore it. The <DocsCode>object</DocsCode> helper builds an
        object from its named parameters, which is how you construct object
        values inline:
      </DocsP>
      <DocsCodeBlock language="bigodon">{`{{json (object id=(uuid) status='PENDING' item=request.body)}}`}</DocsCodeBlock>
      <DocsUl>
        <li>
          Named parameters always come last: a positional argument after a named
          one is a parse error.
        </li>
        <li>
          No spaces around <DocsCode>=</DocsCode>, and names must be unique
          within a call.
        </li>
        <li>
          <DocsCode>object</DocsCode> rejects positional arguments. Its result
          renders as <DocsCode>[object Object]</DocsCode> if printed directly;
          wrap it in <DocsCode>json</DocsCode> to render it, or pass it where a
          value is expected, like flag values.
        </li>
      </DocsUl>

      <DocsH2>Gotchas</DocsH2>
      <DocsUl>
        <li>
          <DocsCode>default</DocsCode> only falls back on missing values; empty
          strings and <DocsCode>0</DocsCode> pass through.
        </li>
        <li>
          Date helpers require ISO strings with an explicit time part:{" "}
          <DocsCode>2024-01-01T00:00:00.000Z</DocsCode>, not{" "}
          <DocsCode>2024-01-01</DocsCode>.
        </li>
        <li>
          Dot-chaining on helper results is invalid:{" "}
          <DocsCode>(itemAt arr 0).name</DocsCode> does not parse; use{" "}
          <DocsCode>{"{{pick (itemAt arr 0) 'name'}}"}</DocsCode>.
        </li>
        <li>
          <DocsCode>{"{{uuid}}"}</DocsCode> calls the helper; to read a context
          field literally named <DocsCode>uuid</DocsCode>, write{" "}
          <DocsCode>{"{{$this.uuid}}"}</DocsCode>. The same applies to every
          helper name: a payload field called <DocsCode>object</DocsCode>{" "}
          (common in payment APIs) is read with{" "}
          <DocsCode>{"{{$this.object}}"}</DocsCode>.
        </li>
      </DocsUl>
      <Callout variant="tip">
        The practical, example-driven walkthrough of all of this is the{" "}
        <DocsLink href="/creating-mocks/templating">Templating</DocsLink> page;
        Mocko&apos;s own helpers (status, headers, proxy, flags) are in{" "}
        <DocsLink href="/reference/helpers">Template Helpers</DocsLink>.
      </Callout>
    </DocsPage>
  );
}
