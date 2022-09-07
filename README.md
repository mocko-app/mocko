# Mocko
Mocking made easy, create dynamic mocks, proxy your API and choose which endpoints to mock.

## Getting started - CLI
If you want to:
- Manage your mocks in configuration files, structured and versioned in folders
- Mock integrations for automated tests
- Run it anywhere with a command and no dependencies

Check the getting started guide for the Standalone Mode [here](https://mocko.dev/docs/getting-started/standalone/)
![CLI example](https://cdn.codetunnel.net/mocko/docs-mocko-cli-example.gif)

## Getting started - UI
If you want to:
- Manage your mocks in a web UI, no configuration or CLIs needed
- Mock scenarions in your staging environments on-the-go
- Mock integrations in your development environment

Check the getting started guide for the Complete Stack [here](https://mocko.dev/docs/getting-started/complete/)
![UI example](https://cdn.codetunnel.net/mocko/docs-mocko-example.gif)

## Getting started - SaaS
If you want to:
- Create mocks that are available everywhere, in the cloud
- No installation or configuration required
- Manage your mocks in a web UI

Check the Mocko Cloud [here](https://mocko.dev/)
![SaaS example](https://cdn.codetunnel.net/mocko/docs-mocko-saas-example.gif)

## Features
- Choose how to manage your mocks
    - Use a simple web UI for speed
    - Use HCL files for documentation and versioning
- Create mocks with rules for matching multiple paths
- Proxy your real API: Requests will be passed through to it unless there's a mock
- Create dynamic mocks using Handlebars (more [here](https://docs.mocko.dev/templating/))
- Easy to deploy: You can deploy it in containers or even using a CLI <!-- TODO reference for deploy doc -->
- Really, **really** fast. Run your tests as fast as you can.
## When to use?
- Mocking integrations for tests, non-productive environments or local development
- Mocking your own services on development environment to make it easy to simulate
complicated scenarios
- Mocking your future services on development environment to allow the front end and
the back end to develop in parallel (after that, delete the mock and it'll be automatically
proxied to the real service)

# Getting started
Check our full documentation and Getting Started at
[docs.mocko.dev](https://cdt.one/WzuRdVq)

Or use our SaaS version for ease of use at [mocko.dev](https://mocko.dev/)

<!-- TODO contributing -->

## For installation, usage or any help, email us contact@mocko.dev
