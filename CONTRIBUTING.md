# Contributing

Thanks for taking the time to contribute to Mocko.

For small fixes, docs improvements, tests, and obvious bug fixes, feel free to open a pull request directly.

For larger changes, open an issue first so we can align on the design before you spend time implementing it. This is especially useful for changes that affect mock definition syntax, templating behavior, routing, persistence, the Control Panel UX, or public package APIs.

## Repository Layout

Mocko is an npm workspace with a few focused packages:

- `mocko-core`: HTTP mock server. It loads File Mocks, matches incoming requests, renders Bigodon templates, manages flags, and proxies unmatched requests.
- `mocko-control`: Control Panel. It is a Next.js app for managing mocks, hosts, flags, and management operations.
- `mocko-cli`: CLI entrypoint. It starts `mocko-core` and, by default, the Control Panel.
- `mocko-sdk`: TypeScript SDK for test automation and flags.
- `mocko-tests`: Integration test suite. It spawns real Mocko processes and exercises them over HTTP.
- `helm-charts/mocko`: Kubernetes deployment chart.
- `docker-images`: Docker image definitions.

## Requirements

Use the current Node.js LTS version for development.

You also need npm. Docker is optional, but useful for Redis-backed development and tests.

## Install

Install dependencies from the repository root:

```sh
npm install
```

## Running Mocko Locally

To build and run the full app from the repository root:

```sh
npm start
```

This builds `mocko-core` and `mocko-control`, then starts Mocko through the local CLI with File Mocks from `./mocko-core/mocks`.

After you have already built the packages, use the faster local start command:

```sh
npm run start:fast
```

The Control Panel is available at [http://localhost:6625](http://localhost:6625), and mocked endpoints are served from [http://localhost:8080](http://localhost:8080).

You can also run the CLI directly:

```sh
node ./mocko-cli/bin/main.js ./mocko-core/mocks --watch
```

## Working On Each Package

Run `mocko-core` directly when working on request handling, routing, templating, flags, proxying, or File Mock loading:

```sh
npm run start:dev --prefix ./mocko-core
```

Run `mocko-control` directly when working on the Control Panel:

```sh
npm run dev --prefix ./mocko-control
```

Build individual packages when you want a focused check:

```sh
npm run build --prefix ./mocko-core
npm run build --prefix ./mocko-control
npm run build --prefix ./mocko-sdk
```

For Control Panel changes, `npm run build --prefix ./mocko-control` is usually enough because it lints and builds the UI.

## Redis For Development

Most local development does not require Redis. Use Redis when you are working on persistence, multi-replica behavior, Redis-backed flags, or management operations.

Start the contributor Redis service:

```sh
docker compose -f ./mocko-tests/docker-compose.yaml up -d redis
```

Stop it when you are done:

```sh
docker compose -f ./mocko-tests/docker-compose.yaml down
```

The Redis test harness uses `127.0.0.1:6379`, database `15`, and flushes that database before and after Redis suites.

## Testing

Run the standard test suite from the repository root:

```sh
npm test
```

This builds `mocko-core`, `mocko-control`, and `mocko-sdk`, then runs the integration tests in `mocko-tests`.

For a faster loop after packages are already built:

```sh
npm run test:fast
```

Run the Redis-enabled suite when your change touches Redis-backed behavior:

```sh
npm run test:full
```

Redis tests expect Redis to be available at `127.0.0.1:6379`.

Run SDK tests directly when working on `@mocko/sdk`:

```sh
npm test --prefix ./mocko-sdk
```

## Architecture Overview

Mocko v2 is split into a core runtime, a control plane, and a CLI.

The core runtime lives in `mocko-core`. It receives HTTP requests, loads File Mocks, matches routes, renders Bigodon templates, applies response status, headers and delay, reads or writes flags, and proxies unmatched requests when an upstream URL is configured.

The control plane lives in `mocko-control`. It is a Next.js app that provides the Control Panel UI and APIs for mocks, hosts, flags, and management operations.

The CLI lives in `mocko-cli`. It wires the runtime together for local and self-hosted usage: starts core, starts the Control Panel unless disabled, passes CLI options into core, and watches File Mock folders when `--watch` is enabled.

The typical request flow is:

1. The CLI starts `mocko-core` and, unless disabled, `mocko-control`.
2. Core loads File Mocks from the selected folder.
3. Control can create UI-managed mocks, hosts, flags, and management operations.
4. Incoming HTTP requests hit core.
5. Core matches a mock route, renders the template, applies status, headers and delay, then returns the response.
6. If no mock matches, core proxies the request when an upstream URL is configured.
7. Flags can be read and written by templates, Control Panel APIs, and `@mocko/sdk`.
