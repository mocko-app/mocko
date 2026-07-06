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
  title: "List and Detail From Data",
  description:
    "Serve a Mocko collection endpoint and a detail endpoint with 404 handling from a single data block of fixtures.",
};

export default function ListAndDetailPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Recipes</DocsEyebrow>
      <DocsTitle>List and Detail From Data</DocsTitle>
      <DocsLead>
        The most common pair of endpoints in any API: a collection and a detail
        view of the same resources. This recipe serves both from one{" "}
        <DocsLink href="/creating-mocks/data-blocks">data block</DocsLink>, so
        the fixtures live in a single place and unknown ids return a proper{" "}
        <DocsCode>404</DocsCode>.
      </DocsLead>

      <DocsH2>The recipe</DocsH2>
      <DocsCodeBlock language="hcl">{`data "products" {
  product {
    id      = 1
    content = <<-EOF
      {
        "id": 1,
        "name": "Widget",
        "price": 9.99
      }
    EOF
  }
  product {
    id      = 2
    content = <<-EOF
      {
        "id": 2,
        "name": "Gadget",
        "price": 24.99
      }
    EOF
  }
  product {
    id      = 3
    content = <<-EOF
      {
        "id": 3,
        "name": "Doohickey",
        "price": 4.99
      }
    EOF
  }
}

mock "GET /products" {
  format = "json"
  body = <<-EOF
    [
      {{#forEach data.products.product}}
        {{item.content}}{{^isLast}},{{/isLast}}
      {{/forEach}}
    ]
  EOF
}

mock "GET /products/{id}" {
  format = "json"
  body = <<-EOF
    {{= $id request.params.id}}
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
    {{/unless}}
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Try it</DocsH2>
      <DocsSnippet
        command="curl http://localhost:8080/products/2"
        output={`{
  "id": 2,
  "name": "Gadget",
  "price": 24.99
}`}
        className="mb-4"
      />
      <DocsSnippet
        command="curl -i http://localhost:8080/products/99"
        output={`HTTP/1.1 404 Not Found
...
{
  "error": "Not found"
}`}
        className="mb-4"
      />

      <DocsH2>How it works</DocsH2>
      <DocsUl>
        <li>
          Each product carries an <DocsCode>id</DocsCode> for lookups and a{" "}
          <DocsCode>content</DocsCode> heredoc holding the full payload. The
          list endpoint just concatenates the payloads with{" "}
          <DocsCode>forEach</DocsCode> and{" "}
          <DocsCode>{"{{^isLast}},{{/isLast}}"}</DocsCode> commas.
        </li>
        <li>
          The detail endpoint extracts the path parameter to{" "}
          <DocsCode>$id</DocsCode> <em>before</em> the loop, because inside{" "}
          <DocsCode>forEach</DocsCode> the context changes and{" "}
          <DocsCode>request</DocsCode> is out of scope.
        </li>
        <li>
          <DocsCode>is</DocsCode> compares with loose equality, which matters
          here: the path parameter is the string{" "}
          <DocsCode>&quot;2&quot;</DocsCode> while the data block id is the
          number <DocsCode>2</DocsCode>. <DocsCode>eq</DocsCode> would never
          match.
        </li>
        <li>
          <DocsCode>$found</DocsCode> starts false and flips when a product
          matches. Variables have global scope, so the assignment inside the
          loop is visible to the <DocsCode>unless</DocsCode> block after it,
          which turns no-match into a <DocsCode>404</DocsCode>.
        </li>
      </DocsUl>
      <Callout variant="tip">
        This pattern is the read-only sibling of{" "}
        <DocsLink href="/recipes/stateful-crud">Stateful CRUD</DocsLink>. The
        two combine well: serve the baseline catalog from data and layer runtime
        changes on top with flags.
      </Callout>

      <DocsH2>Variations</DocsH2>
      <DocsUl>
        <li>
          For paginated lists, extract{" "}
          <DocsCode>data.products.product</DocsCode> to a variable and combine{" "}
          <DocsCode>slice</DocsCode>, <DocsCode>length</DocsCode>, and query
          parameters. The helpers are in the{" "}
          <DocsLink href="/reference/bigodon">Bigodon reference</DocsLink>.
        </li>
        <li>
          To filter the list by a query parameter, reuse the detail
          endpoint&apos;s loop-and-match shape, accumulating matches instead of
          rendering a single one.
        </li>
      </DocsUl>
    </DocsPage>
  );
}
