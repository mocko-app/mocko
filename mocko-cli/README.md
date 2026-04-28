# @mocko/cli

Dynamic HTTP mocking from your terminal.

Mocko CLI starts the Mocko mock server and, by default, the Control Panel. Use it to create dynamic API mocks, run versioned File Mocks, proxy real APIs, and simulate stateful flows with flags.

![Mocko Control Panel](https://cdn.codetunnel.net/mocko/readme-control-panel.png)

## Installation

```sh
npm i -g @mocko/cli
```

Check the installation:

```sh
mocko --help
```

## Quick Start

Start Mocko with the Control Panel enabled:

```sh
mocko
```

Open the Control Panel at [http://localhost:6625](http://localhost:6625). Mocked HTTP endpoints are served from [http://localhost:8080](http://localhost:8080).

## Run File Mocks

Create `./mocks/orders.hcl`:

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

Run Mocko pointing to the folder:

```sh
mocko --watch ./mocks
```

Call the mock:

```sh
curl http://localhost:8080/orders/123
```

File Mocks are loaded into the mock server and shown in the Control Panel.

## Proxy An API

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

## Flags And Tests

Flags are persisted values that mocks, the Control Panel, and automated tests can read and write. Use them to simulate multi-step flows such as balances, purchases, inventory, order status, or feature switches.

For test automation, use `@mocko/sdk`:

```sh
npm install @mocko/sdk
```

![Mocko Flags](https://cdn.codetunnel.net/mocko/readme-flags.png)

## Options

```text
Usage: mocko [options] [path to mocks folder]
Example: mocko --watch ./mocks

Options:

  -h, --help       Shows this screen
  -v, --version    Shows the current version
  -w, --watch      Watches for file changes and restarts the server
  -p, --port       Port to serve the mocks (8080)
  -u, --url        URL to proxy requests when no mock is defined
  -t, --timeout    Max time to wait for a response from the proxied URL in millis (30000)
  --no-ui          Disables the Control Panel
  -r, --redis      Enables Redis mode using the provided Redis URL
  -P, --ui-port    Overrides the Control Panel port (6625)
```

## Documentation

- [Mocko on GitHub](https://github.com/mocko-app/mocko)
- [Getting started](https://mocko.dev/docs/getting-started/)
- [File Mocks](https://mocko.dev/docs/file-mocks/)
- [Templating](https://mocko.dev/docs/templating/)
- [Flags](https://mocko.dev/docs/flags/)
- [SDK](https://mocko.dev/docs/sdk/)
- [Deploying](https://mocko.dev/docs/deploying/)
