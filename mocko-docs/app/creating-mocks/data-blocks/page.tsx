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
  title: "Data Blocks",
  description:
    "Share fixtures across Mocko mocks with data blocks: flat values, repeated sub-blocks, iteration with forEach, and multi-file organization.",
};

export default function DataBlocksPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>Data Blocks</DocsTitle>
      <DocsLead>
        Data blocks hold fixture data outside your mock bodies: a product
        catalog, seed users, environment settings. Every mock can read them, so
        the data is defined once and reused everywhere. By the end of this page
        you will know both data block shapes and the one rule that trips
        everyone up.
      </DocsLead>

      <DocsH2>Flat values</DocsH2>
      <DocsP>
        The simplest data block is a set of key-value pairs, available to all
        mocks under <DocsCode>{"data.<block>.<key>"}</DocsCode>:
      </DocsP>
      <DocsCodeBlock>{`data "settings" {
  environment = "staging"
  base_url    = "https://api.example.com"
}

mock "GET /info" {
  format = "json"
  body = <<-EOF
    {
      "environment": "{{data.settings.environment}}",
      "api": "{{data.settings.base_url}}"
    }
  EOF
}`}</DocsCodeBlock>
      <DocsP>
        Change the value in one place and every mock that references it follows.
        This is handy for anything repeated across bodies: hostnames, tenant
        ids, feature names.
      </DocsP>

      <DocsH2>Repeated sub-blocks</DocsH2>
      <DocsP>
        For collections, repeat a named sub-block. Each repetition becomes an
        element of an array:
      </DocsP>
      <DocsCodeBlock>{`data "catalog" {
  product {
    id    = 1
    name  = "Widget"
    price = 9.99
  }
  product {
    id    = 2
    name  = "Gadget"
    price = 24.99
  }
}

mock "GET /products" {
  format = "json"
  body = <<-EOF
    [
      {{#forEach data.catalog.product}}
        {
          "id": {{item.id}},
          "name": "{{item.name}}",
          "price": {{item.price}}
        }{{^isLast}},{{/isLast}}
      {{/forEach}}
    ]
  EOF
}`}</DocsCodeBlock>
      <DocsSnippet
        command="curl http://localhost:8080/products"
        output={`[
  { "id": 1, "name": "Widget", "price": 9.99 },
  { "id": 2, "name": "Gadget", "price": 24.99 }
]`}
        className="mb-4"
      />
      <Callout variant="warning">
        Named sub-blocks are <strong>always arrays</strong>, even when defined
        once. A single <DocsCode>product</DocsCode> block still makes{" "}
        <DocsCode>data.catalog.product</DocsCode> an array with one element, so{" "}
        <DocsCode>{"{{data.catalog.product.name}}"}</DocsCode> renders nothing.
        Iterate with <DocsCode>forEach</DocsCode>, or read one element with{" "}
        <DocsCode>{"{{pick (itemAt data.catalog.product 0) 'name'}}"}</DocsCode>
        .
      </Callout>

      <DocsH2>Storing whole payloads</DocsH2>
      <DocsP>
        When each entry is a full JSON payload rather than a few fields, give
        the sub-block a heredoc field. A common convention is an{" "}
        <DocsCode>id</DocsCode> for lookups plus a <DocsCode>content</DocsCode>{" "}
        field holding the payload:
      </DocsP>
      <DocsCodeBlock>{`data "products" {
  product {
    id      = 1
    content = <<-EOF
      {
        "name": "Widget",
        "price": 9.99,
        "tags": ["hardware", "bestseller"]
      }
    EOF
  }
  product {
    id      = 2
    content = <<-EOF
      {
        "name": "Gadget",
        "price": 24.99,
        "tags": []
      }
    EOF
  }
}`}</DocsCodeBlock>
      <DocsP>
        Rendering <DocsCode>{"{{item.content}}"}</DocsCode> inserts the whole
        payload. The{" "}
        <DocsLink href="/recipes/list-and-detail">
          List and Detail From Data
        </DocsLink>{" "}
        recipe uses this convention to serve a collection endpoint and a detail
        endpoint with 404 handling from a single data block.
      </DocsP>

      <DocsH2>Organizing data across files</DocsH2>
      <DocsP>
        Data blocks merge across every <DocsCode>.hcl</DocsCode> file Mocko
        loads, so fixtures usually live in their own file, away from the routes
        that consume them:
      </DocsP>
      <DocsCodeBlock>{`mocks/
  products.hcl       # mocks reading data.catalog
  users.hcl
  shared/
    data.hcl         # data "catalog", data "settings", ...`}</DocsCodeBlock>

      <DocsH2>Behavior details</DocsH2>
      <DocsUl>
        <li>
          Data blocks are read-only at runtime. For state that changes between
          requests, use <DocsLink href="/creating-mocks/flags">flags</DocsLink>;
          a common combination is data blocks for the baseline and flags for the
          overrides.
        </li>
        <li>
          Inside <DocsCode>forEach</DocsCode> and other context-changing blocks,{" "}
          <DocsCode>data</DocsCode> is out of scope just like{" "}
          <DocsCode>request</DocsCode>. Extract what you need to a variable
          first, as shown in{" "}
          <DocsLink href="/creating-mocks/templating">Templating</DocsLink>.
        </li>
        <li>
          Dot-chaining on helper results is not valid Bigodon:{" "}
          <DocsCode>(itemAt arr 0).name</DocsCode> does not parse. That is why
          single-element access goes through <DocsCode>pick</DocsCode>.
        </li>
      </DocsUl>

      <DocsH2>Next</DocsH2>
      <DocsP>
        That completes the building blocks: files, the UI, templates, matching,
        flags, proxying, and data. The{" "}
        <DocsLink href="/recipes">Recipes</DocsLink> section combines them into
        complete, copy-pasteable scenarios.
      </DocsP>
    </DocsPage>
  );
}
