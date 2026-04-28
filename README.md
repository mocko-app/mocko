# Mocko

Dynamic HTTP mocking for local development, staging environments, and automated tests.

Mocko lets you simulate APIs that are unavailable, expensive, unstable, or difficult to put in the exact state you need. Create mocks in the Control Panel for fast iteration, keep File Mocks in your repository for reviewable scenarios, proxy real APIs when no mock matches, and use flags to drive stateful flows across requests and tests.

![Mocko Control Panel](https://cdn.codetunnel.net/mocko/readme-control-panel.png)

## Why Mocko?

- Create dynamic responses from request params, query strings, headers, bodies, and persisted state.
- Manage mocks visually in the Control Panel or as versioned HCL files.
- Proxy real services and mock only the endpoints or scenarios you need.
- Persist state with flags to simulate multi-step flows across requests or from automated tests.
- Integrate tests with mocked APIs through `@mocko/sdk`.
- Run locally with one command, then add Docker, Kubernetes, or Redis when your environment needs it.

## Quick Start

Install the CLI:

```sh
npm i -g @mocko/cli
```

Start Mocko:

```sh
mocko
```

Open the Control Panel at [http://localhost:6625](http://localhost:6625). Mocked HTTP endpoints are served from [http://localhost:8080](http://localhost:8080).

## Your First Mock

In the Control Panel, create a mock:

```hbs
{
  "id": "{{request.params.id}}",
  "status": "processing",
  "etaMinutes": {{random 5 30}}
}
```

Call it from your terminal:

```sh
curl http://localhost:8080/orders/123
```

Mocko renders the response using the incoming request:

```json
{
  "id": "123",
  "status": "processing",
  "etaMinutes": 18
}
```

When `format = "json"` is enabled, Mocko validates and formats JSON responses for you.

![Creating a mock in Mocko](https://cdn.codetunnel.net/mocko/readme-create-mock.png)

## File Mocks

You can also keep mocks as files in your repository. Create a `./mocks` folder with an `orders.hcl` file inside:

```hcl
mock "GET /orders/{id}" {
  name   = "Get order"
  labels = ["orders", "checkout"]
  format = "json"

  body = <<EOF
    {
      "id": "{{request.params.id}}",
      "status": "{{default request.query.status 'processing'}}",
      "etaMinutes": {{random 5 30}}
    }
  EOF
}
```

Run Mocko pointing to that folder:

```sh
mocko --watch ./mocks
```

File Mocks are loaded into the same mock server and shown in the Control Panel, so you can combine fast UI iteration with versioned, reviewable scenarios.

## Dynamic Responses

Mocko uses Bigodon, a purpose-built templating language for dynamic mocks. It supports variables, conditionals, loops, helpers, flags, and proxy decisions while keeping mock files readable.

```hcl
mock "GET /orders/{id}" {
  name   = "Get order scenario"
  labels = ["orders", "scenarios"]
  format = "json"

  body = <<EOF
    {{#is request.params.id "failed"}}
      {{setStatus 503}}
      {
        "message": "Order service unavailable"
      }
    {{else}}
      {
        "id": "{{request.params.id}}",
        "status": "processing",
        "etaMinutes": {{random 5 30}}
      }
    {{/is}}
  EOF
}
```

```sh
curl http://localhost:8080/orders/123
curl http://localhost:8080/orders/failed
```

See the [templating docs](https://mocko.dev/docs/templating/) and the [Bigodon repository](https://github.com/mocko-app/bigodon) for the full syntax and helper reference.

## Stateful Mocks

Flags are persisted values that mocks and tests can both read and write. Use them to simulate multi-step flows, feature switches, user state, queues, inventory, or any scenario where one request should affect another.

```hcl
mock "PUT /orders/{id}/status" {
  name   = "Update order status"
  labels = ["orders", "stateful"]
  format = "json"

  body = <<EOF
    {{= $key (append 'orders:' request.params.id ':status')}}
    {{setFlag $key request.body.status}}
    {
      "id": "{{request.params.id}}",
      "status": "{{getFlag $key}}"
    }
  EOF
}

mock "GET /orders/{id}" {
  name   = "Get stateful order"
  labels = ["orders", "stateful"]
  format = "json"

  body = <<EOF
    {{= $key (append 'orders:' request.params.id ':status')}}
    {
      "id": "{{request.params.id}}",
      "status": "{{default (getFlag $key) 'processing'}}"
    }
  EOF
}
```

Flags can also be created, edited, filtered, and deleted from the Control Panel.

![Mocko Flags](https://cdn.codetunnel.net/mocko/readme-flags.png)

## SDK for Tests

Install the SDK in your test project:

```sh
npm install @mocko/sdk
```

Use it to set up mock state directly from tests:

```ts
import { MockoClient } from '@mocko/sdk';

const mocko = new MockoClient('http://localhost:8080');

const orderStatus = mocko
  .defineFlag<string>('Order status')
  .pattern('orders:{id}:status');

await orderStatus.set('123', 'shipped');

const response = await fetch('http://localhost:8080/orders/123');
expect(await response.json()).toMatchObject({
  id: '123',
  status: 'shipped',
});
```

See the [SDK docs](https://mocko.dev/docs/sdk/) for typed flags, TTLs, and authentication.

## Proxy Real APIs

Mocko can sit in front of a real API. Requests with matching mocks are handled by Mocko; everything else is proxied.

```sh
mocko --watch ./mocks --url https://api.example.com
```

Templates can also choose when to proxy:

```hcl
mock "GET /orders/{id}" {
  format = "json"

  body = <<EOF
    {{#is request.params.id "preview"}}
      {
        "id": "preview",
        "status": "draft"
      }
    {{else}}
      {{proxy}}
    {{/is}}
  EOF
}
```

Use hosts when you need to route different mock groups to different upstream services. See the [proxy and hosts docs](https://mocko.dev/docs/proxying/).

## Deployment

Mocko can run as:

- A local CLI process for development.
- A Docker container for shared environments.
- A Kubernetes deployment with the Mocko Helm chart.
- An in-memory instance for simple setups.
- A Redis-backed instance when you need persistence or multiple replicas.

See the [deployment docs](https://mocko.dev/docs/deploying/) for Docker, Kubernetes, Redis, and environment configuration.

## Migrating from v1

Mocko v2 replaces Handlebars with Mocko's purpose-built templating language, adds a new Control Panel, makes File Mocks visible in the UI, improves flags, and introduces the SDK for test automation.

Migration tools and guides are available in the [v1 to v2 migration docs](https://mocko.dev/docs/migration/v1-to-v2/).

## Documentation

- [Getting started](https://mocko.dev/docs/getting-started/)
- [File Mocks](https://mocko.dev/docs/file-mocks/)
- [Templating](https://mocko.dev/docs/templating/)
- [Flags](https://mocko.dev/docs/flags/)
- [SDK](https://mocko.dev/docs/sdk/)
- [Deploying](https://mocko.dev/docs/deploying/)

## Mocko Cloud

Mocko Cloud is the hosted version of Mocko for teams that want managed infrastructure and shared environments without running their own deployment.

Learn more at [mocko.dev](https://mocko.dev/).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development, testing, and contribution guidelines.
