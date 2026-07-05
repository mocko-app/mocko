import type { Metadata } from "next";
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
  title: "Recipes",
  description:
    "Practical Mocko recipes for stateful CRUD, data-driven endpoints, append-only lists, proxying, slow APIs, polling, debugging, and microservices.",
};

const recipes = [
  {
    title: "Stateful CRUD",
    description:
      "Use flags as a lightweight state store for create, read, update, and delete flows.",
  },
  {
    title: "List and Detail From Data",
    description:
      "Use data blocks as fixtures for a collection endpoint and a detail endpoint.",
  },
  {
    title: "Append to a List",
    description:
      "Receive submitted items with POST and return the accumulated list with GET.",
  },
  {
    title: "Mock One Edge Case",
    description:
      "Proxy normal traffic while mocking one route, query branch, or request shape.",
  },
  {
    title: "Simulate Slow or Unstable APIs",
    description: "Add delay, random failures, and proxy successful branches.",
  },
  {
    title: "Polling Status Flow",
    description: "Return changing statuses for async jobs and polling UIs.",
  },
  {
    title: "Debug Broken JSON",
    description:
      "Find invalid JSON, trailing commas, missing values, and context mistakes.",
  },
  {
    title: "Mock Microservices by Host",
    description:
      "Put Mocko in front of multiple services and scope mocks by Host header.",
  },
] as const;

export default function RecipesPage() {
  return (
    <DocsPage>
      <DocsEyebrow>Creating Mocks</DocsEyebrow>
      <DocsTitle>Recipes</DocsTitle>
      <DocsLead>
        Recipes combine file mocks, templates, flags, data blocks, proxying, and
        hosts into common API behaviors.
      </DocsLead>

      <div className="mb-8 grid gap-3 md:grid-cols-2">
        {recipes.map((recipe) => (
          <div
            key={recipe.title}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="mb-1 text-[13px] font-semibold text-foreground">
              {recipe.title}
            </p>
            <p className="text-[12px] leading-[1.65] text-muted-foreground">
              {recipe.description}
            </p>
          </div>
        ))}
      </div>

      <DocsH2>Stateful CRUD</DocsH2>
      <DocsP>
        Store resource state in flags when you need a mock to remember changes
        across requests. Keep this practical: model the behavior your client
        needs instead of recreating a full database.
      </DocsP>
      <DocsCodeBlock>{`mock "PUT /users/{id}" {
  headers { Content-Type = "application/json" }
  body = <<-EOF
    {{= $key (append 'users:' request.params.id)}}
    {{setFlag $key request.body}}
    {
      "id": {{request.params.id}},
      "name": "{{request.body.name}}"
    }
  EOF
}

mock "GET /users/{id}" {
  headers { Content-Type = "application/json" }
  body = <<-EOF
    {{= $key (append 'users:' request.params.id)}}
    {{#hasFlag $key}}
      {{json (getFlag $key) true}}
    {{else}}
      {{setStatus 404}}
      { "error": "User not found" }
    {{/hasFlag}}
  EOF
}`}</DocsCodeBlock>

      <DocsH2>List and Detail From Data</DocsH2>
      <DocsP>
        Use data blocks for stable fixtures such as product catalogs, seed
        users, or error examples.
      </DocsP>
      <DocsCodeBlock>{`data "products" {
  product {
    id = 1
    name = "Widget"
    price = 9.99
  }
  product {
    id = 2
    name = "Gadget"
    price = 24.99
  }
}

mock "GET /products" {
  headers { Content-Type = "application/json" }
  body = <<-EOF
    [
      {{#forEach data.products.product}}
        { "id": {{item.id}}, "name": "{{item.name}}", "price": {{item.price}} }{{^isLast}},{{/isLast}}
      {{/forEach}}
    ]
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Append to a List</DocsH2>
      <DocsP>
        A purchase flow is a good fit for append-only state: accept submitted
        purchases with <DocsCode>POST /purchases</DocsCode>, then list the
        current purchases with <DocsCode>GET /purchases</DocsCode>.
      </DocsP>
      <DocsCodeBlock>{`mock "POST /purchases" {
  headers { Content-Type = "application/json" }
  body = <<-EOF
    {{= $id (uuid)}}
    {{= $ids (getFlag 'purchases:ids')}}
    {{#if $ids}}
      {{setFlag 'purchases:ids' (append $ids ',' $id)}}
    {{else}}
      {{setFlag 'purchases:ids' $id}}
    {{/if}}
    {{setFlag (append 'purchases:' $id) request.body}}
    {{setStatus 201}}
    {
      "id": "{{$id}}",
      "status": "created"
    }
  EOF
}

mock "GET /purchases" {
  headers { Content-Type = "application/json" }
  body = <<-EOF
    {{= $ids (getFlag 'purchases:ids')}}
    [
      {{#if $ids}}
        {{#forEach (split $ids ',')}}
          {{json (getFlag (append 'purchases:' item))}}{{^isLast}},{{/isLast}}
        {{/forEach}}
      {{/if}}
    ]
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Mock One Edge Case</DocsH2>
      <DocsP>
        Keep most traffic going to the real backend, but intercept the case you
        need to test.
      </DocsP>
      <DocsCodeBlock>{`mock "GET /posts" {
  body = <<-EOF
    {{#is request.query.userId 1}}
      []
    {{else}}
      {{proxy}}
    {{/is}}
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Simulate Slow or Unstable APIs</DocsH2>
      <DocsP>
        Combine <DocsCode>delay</DocsCode>, random values, status overrides, and
        proxying to simulate an unreliable dependency.
      </DocsP>
      <DocsCodeBlock>{`mock "GET /reports/{id}" {
  delay = 1000
  body = <<-EOF
    {{#lt (random 0 100) 30}}
      {{setStatus 500}}
      { "message": "Temporary upstream error" }
    {{else}}
      {{proxy}}
    {{/lt}}
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Polling Status Flow</DocsH2>
      <DocsP>
        Store a counter or status in flags to model async operations that move
        from queued to processing to done.
      </DocsP>
      <DocsCodeBlock>{`mock "GET /exports/{id}" {
  headers { Content-Type = "application/json" }
  body = <<-EOF
    {{= $key (append 'exports:' request.params.id ':count')}}
    {{= $count (toInt (default (getFlag $key) 0))}}
    {{setFlag $key (add $count 1)}}
    {{#lt $count 1}}
      { "status": "queued" }
    {{else lt $count 3}}
      { "status": "processing" }
    {{else}}
      { "status": "done" }
    {{/lt}}
  EOF
}`}</DocsCodeBlock>

      <DocsH2>Debug Broken JSON</DocsH2>
      <DocsP>
        If JSON comes back unformatted or as raw text, the rendered body is not
        valid JSON. Look for missing quotes, empty values, and trailing commas.
      </DocsP>
      <ul className="mb-4 space-y-1.5 text-[14px] leading-7 text-fg-2">
        <li>
          Use <DocsCode>{"{{log (json value)}}"}</DocsCode> to inspect a value
          in the server output.
        </li>
        <li>
          Prefer <DocsCode>forEach</DocsCode> for comma-separated arrays because
          it exposes <DocsCode>isLast</DocsCode>.
        </li>
        <li>
          If a value is blank inside a loop, use a variable before the loop or{" "}
          <DocsCode>$root</DocsCode>.
        </li>
      </ul>

      <DocsH2>Mock Microservices by Host</DocsH2>
      <DocsP>
        Define one host per service, scope mocks to the service that needs the
        override, and let unmatched requests proxy to the right destination.
      </DocsP>
      <DocsCodeBlock>{`host "billing" {
  source      = "billing.local"
  destination = "http://billing:3000"
}

host "catalog" {
  source      = "catalog.local"
  destination = "http://catalog:3000"
}

mock "GET /invoices/{id}" {
  host = "billing"
  body = "{ \\"id\\": {{request.params.id}}, \\"status\\": \\"paid\\" }"
}

mock "GET /products/{id}" {
  host = "catalog"
  body = "{ \\"id\\": {{request.params.id}}, \\"available\\": false }"
}`}</DocsCodeBlock>
    </DocsPage>
  );
}
