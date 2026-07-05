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
  title: "Templating",
  description:
    "Make Mocko responses dynamic with Bigodon templates: request data, helpers, conditionals, status overrides, variables, and loops.",
};

export default function TemplatingPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>Templating</DocsTitle>
      <DocsLead>
        Mock bodies are templates written in Bigodon, a Handlebars-like
        language. By the end of this page you will be able to render request
        data into responses, branch on conditions, override the status code, and
        build JSON arrays with loops. We will grow one orders API from a static
        response to a fully dynamic one.
      </DocsLead>

      <DocsH2>Your first template</DocsH2>
      <DocsP>
        Anything between <DocsCode>{"{{"}</DocsCode> and{" "}
        <DocsCode>{"}}"}</DocsCode> is a template expression, evaluated on every
        request. The simplest expression is a path into the request:
      </DocsP>
      <DocsCodeBlock>{`mock "GET /orders/{id}" {
  format = "json"
  body = <<-EOF
    {
      "id": {{request.params.id}},
      "status": "shipped"
    }
  EOF
}`}</DocsCodeBlock>
      <DocsSnippet
        command="curl http://localhost:8080/orders/31"
        output={`{
  "id": 31,
  "status": "shipped"
}`}
        className="mb-4"
      />

      <DocsH2>The request context</DocsH2>
      <DocsP>
        Every part of the incoming request is available under{" "}
        <DocsCode>request</DocsCode>:
      </DocsP>
      <DocsUl>
        <li>
          <DocsCode>{"{{request.params.id}}"}</DocsCode> reads path parameters
          declared with <DocsCode>{"{id}"}</DocsCode> in the route.
        </li>
        <li>
          <DocsCode>{"{{request.query.page}}"}</DocsCode> reads query string
          values, <DocsCode>?page=2</DocsCode> in this case.
        </li>
        <li>
          <DocsCode>{"{{request.headers.x-user-id}}"}</DocsCode> reads request
          headers. Header names are always lowercase here, no matter how the
          client sent them.
        </li>
        <li>
          <DocsCode>{"{{request.body.email}}"}</DocsCode> reads fields from a
          parsed JSON or form body.
        </li>
      </DocsUl>
      <DocsP>
        Paths traverse nested objects with dots, so{" "}
        <DocsCode>{"{{request.body.customer.email}}"}</DocsCode> works exactly
        as you would expect.
      </DocsP>

      <DocsH2>Helpers</DocsH2>
      <DocsP>
        Helpers are functions called inside an expression. The first word is the
        helper name and the rest are arguments, which can be context paths,
        quoted literals, or numbers:
      </DocsP>
      <DocsCodeBlock>{`{{capitalize request.params.name}}
{{default request.query.page 1}}
{{add request.query.page 1}}`}</DocsCodeBlock>
      <DocsP>
        <DocsCode>default</DocsCode> returns its first argument unless it is
        missing, then falls back to the second. To pass one helper&apos;s result
        to another, wrap the inner call in parentheses:
      </DocsP>
      <DocsCodeBlock>{`{{capitalize (default request.query.name 'stranger')}}`}</DocsCodeBlock>
      <DocsP>
        Bigodon ships helpers for strings, math, arrays, dates, and comparisons,
        and Mocko adds its own on top. This page introduces the ones you will
        use constantly; the{" "}
        <DocsLink href="/reference/bigodon">Bigodon reference</DocsLink> and{" "}
        <DocsLink href="/reference/helpers">
          template helpers reference
        </DocsLink>{" "}
        list them all.
      </DocsP>

      <DocsH2>Conditionals</DocsH2>
      <DocsP>
        A block runs its content only when its expression is truthy. Blocks open
        with <DocsCode>{"{{#...}}"}</DocsCode> and close with{" "}
        <DocsCode>{"{{/...}}"}</DocsCode>, and can have an{" "}
        <DocsCode>{"{{else}}"}</DocsCode>. The <DocsCode>is</DocsCode> helper
        compares two values with loose equality, which is usually what you want
        because path parameters and query values arrive as strings:
      </DocsP>
      <DocsCodeBlock>{`mock "GET /orders/{id}" {
  format = "json"
  body = <<-EOF
    {{#is request.params.id 1}}
      { "id": 1, "status": "shipped" }
    {{else}}
      { "id": {{request.params.id}}, "status": "processing" }
    {{/is}}
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        Chain more cases with <DocsCode>{"{{else is ...}}"}</DocsCode>, closing
        only the outermost block:
      </DocsP>
      <DocsCodeBlock>{`{{#is request.params.id 1}}
  { "status": "shipped" }
{{else is request.params.id 2}}
  { "status": "cancelled" }
{{else}}
  { "status": "processing" }
{{/is}}`}</DocsCodeBlock>
      <DocsP>
        Other comparison helpers work the same way in block position:{" "}
        <DocsCode>eq</DocsCode> (strict equality), <DocsCode>gt</DocsCode>,{" "}
        <DocsCode>gte</DocsCode>, <DocsCode>lt</DocsCode>,{" "}
        <DocsCode>lte</DocsCode>, <DocsCode>startsWith</DocsCode>,{" "}
        <DocsCode>includes</DocsCode>, plus <DocsCode>if</DocsCode> and{" "}
        <DocsCode>unless</DocsCode> for plain truthiness.
      </DocsP>

      <DocsH2>Overriding the status code</DocsH2>
      <DocsP>
        The <DocsCode>status</DocsCode> field is static, but templates can
        override it per request with <DocsCode>setStatus</DocsCode>. It renders
        as an empty string, so it never pollutes the body. This is the standard
        way to mock error branches:
      </DocsP>
      <DocsCodeBlock>{`mock "GET /orders/{id}" {
  format = "json"
  body = <<-EOF
    {{#gt (toInt request.params.id) 100}}
      {{setStatus 404}}
      { "error": "Order not found" }
    {{else}}
      { "id": {{request.params.id}}, "status": "processing" }
    {{/gt}}
  EOF
}`}</DocsCodeBlock>
      <DocsSnippet
        command="curl -i http://localhost:8080/orders/123"
        output={`HTTP/1.1 404 Not Found
...
{
  "error": "Order not found"
}`}
        className="mb-4"
      />
      <DocsP>
        <DocsCode>{"{{setHeader 'name' 'value'}}"}</DocsCode> does the same for
        response headers: side effect only, empty output, and it merges with the
        mock&apos;s <DocsCode>headers</DocsCode> block.
      </DocsP>
      <Callout variant="info">
        <DocsCode>toInt</DocsCode> converts the path parameter to a number
        before the comparison. Params and query values are strings, and while
        loose helpers like <DocsCode>is</DocsCode> coerce for you, ordering
        comparisons like <DocsCode>gt</DocsCode> are safest on real numbers.
      </Callout>

      <DocsH2>Variables</DocsH2>
      <DocsP>
        <DocsCode>{"{{= $name value}}"}</DocsCode> assigns a variable, and{" "}
        <DocsCode>{"{{$name}}"}</DocsCode> reads it. Variables keep templates
        readable when a value is used more than once, and they become essential
        inside loops, as you will see next:
      </DocsP>
      <DocsCodeBlock>{`body = <<-EOF
  {{= $page (toInt (default request.query.page 1))}}
  {
    "page": {{$page}},
    "next": {{add $page 1}}
  }
EOF`}</DocsCodeBlock>
      <DocsP>
        Variables are per request. Each incoming request starts from a clean
        slate, so they are the right tool for intermediate values. For state
        that survives across requests, Mocko has{" "}
        <DocsLink href="/creating-mocks/flags">flags</DocsLink>.
      </DocsP>

      <DocsH2>Loops</DocsH2>
      <DocsP>
        <DocsCode>forEach</DocsCode> iterates an array. Inside the block the
        context changes: <DocsCode>item</DocsCode> is the current element, and
        you also get <DocsCode>index</DocsCode>, <DocsCode>total</DocsCode>,{" "}
        <DocsCode>isFirst</DocsCode>, and <DocsCode>isLast</DocsCode>. The
        negated block <DocsCode>{"{{^isLast}},{{/isLast}}"}</DocsCode> renders a
        comma after every element except the last one, which is exactly what
        JSON arrays need:
      </DocsP>
      <DocsCodeBlock>{`mock "POST /orders" {
  format = "json"
  body = <<-EOF
    {
      "status": "created",
      "items": [
        {{#forEach request.body.items}}
          {
            "sku": "{{item.sku}}",
            "position": {{index}}
          }{{^isLast}},{{/isLast}}
        {{/forEach}}
      ]
    }
  EOF
}`}</DocsCodeBlock>
      <DocsSnippet
        command={`curl -X POST http://localhost:8080/orders -H 'Content-Type: application/json' -d '{"items": [{"sku": "A1"}, {"sku": "B2"}]}'`}
        output={`{
  "status": "created",
  "items": [
    { "sku": "A1", "position": 0 },
    { "sku": "B2", "position": 1 }
  ]
}`}
        className="mb-4"
      />
      <Callout variant="warning">
        Bigodon also has an <DocsCode>each</DocsCode> helper, but{" "}
        <DocsCode>isLast</DocsCode> and friends do not exist inside it, and a{" "}
        <DocsCode>{"{{^isLast}}"}</DocsCode> block there silently renders on
        every iteration, producing a trailing comma and invalid JSON. When
        building JSON arrays, always use <DocsCode>forEach</DocsCode>.
      </Callout>

      <DocsH2>When a value comes back empty</DocsH2>
      <DocsP>
        Inside <DocsCode>forEach</DocsCode> the context is the loop entry, so{" "}
        <DocsCode>request</DocsCode> and other top-level paths are no longer
        directly reachable. A template that reads{" "}
        <DocsCode>{"{{request.query.currency}}"}</DocsCode> inside a loop
        renders an empty string, which is one of the most common template bugs.
        There are two fixes:
      </DocsP>
      <DocsCodeBlock>{`{{! 1. Extract to a variable before the loop (variables stay accessible) }}
{{= $currency request.query.currency}}
{{#forEach request.body.items}}
  { "sku": "{{item.sku}}", "currency": "{{$currency}}" }{{^isLast}},{{/isLast}}
{{/forEach}}

{{! 2. Or reach back to the template root with $root }}
{{#forEach request.body.items}}
  { "sku": "{{item.sku}}", "currency": "{{$root.request.query.currency}}" }{{^isLast}},{{/isLast}}
{{/forEach}}`}</DocsCodeBlock>
      <DocsP>
        The same applies to any block that changes context, such as{" "}
        <DocsCode>each</DocsCode> and <DocsCode>with</DocsCode>.{" "}
        <DocsCode>$parent</DocsCode> steps one context level up and can be
        chained; <DocsCode>$root</DocsCode> always jumps to the top.
      </DocsP>

      <DocsH2>Debugging templates</DocsH2>
      <DocsP>Three signals cover almost every template problem:</DocsP>
      <DocsUl>
        <li>
          A template that fails to compile is reported in the terminal when the
          mock loads, with a line and column pointer.
        </li>
        <li>
          If a JSON response comes back as raw, unformatted text, the rendered
          body was not valid JSON. Mocko logs an error saying so. The usual
          suspects are a trailing comma from <DocsCode>each</DocsCode>, an empty
          value from a context mistake, or missing quotes around a string.
        </li>
        <li>
          <DocsCode>{"{{log 'reached the else branch'}}"}</DocsCode> prints to
          the server console. Combine it with the <DocsCode>json</DocsCode>{" "}
          helper to dump a value:{" "}
          <DocsCode>{"{{log (json request.body)}}"}</DocsCode>.
        </li>
      </DocsUl>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          Variables have global scope within a request: an assignment inside a
          block persists after the block closes. This enables accumulator
          patterns, but also means loops do not sandbox your variables.
        </li>
        <li>
          <DocsCode>default</DocsCode> only falls back on missing values. Empty
          strings and <DocsCode>0</DocsCode> pass through, so{" "}
          <DocsCode>?page=</DocsCode> yields an empty string, not your fallback.
          Use <DocsCode>unless</DocsCode> or a length check for blank-string
          semantics.
        </li>
        <li>
          Literal braces in a body must be escaped as{" "}
          <DocsCode>{"\\{{"}</DocsCode> and <DocsCode>{"\\}}"}</DocsCode>.
          Inside HCL quoted strings (not heredocs), write{" "}
          <DocsCode>{"\\\\{{"}</DocsCode> because HCL consumes one backslash
          itself.
        </li>
        <li>
          Block negation <DocsCode>{"{{^expr}}"}</DocsCode> and blocks in
          general work on helper calls and context paths, not on variables. For
          a variable, use <DocsCode>{"{{#if $var}}"}</DocsCode> or{" "}
          <DocsCode>{"{{#unless $var}}"}</DocsCode>.
        </li>
        <li>
          Date helpers need ISO strings with an explicit time part:{" "}
          <DocsCode>2024-01-01T00:00:00.000Z</DocsCode> works,{" "}
          <DocsCode>2024-01-01</DocsCode> does not.
        </li>
        <li>
          <DocsCode>{"{{random 0 100}}"}</DocsCode> is inclusive on both ends.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        With several mocks defined, which one answers a given request? Continue
        to{" "}
        <DocsLink href="/creating-mocks/matching">How Matching Works</DocsLink>.
      </DocsP>
    </DocsPage>
  );
}
