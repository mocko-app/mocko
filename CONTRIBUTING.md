# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue,
email (o54b27nq0oasp75z5mwr44a4vur17bgp@owlmail.io), or any other method with the owners of this repository before making a change.

# Architecture

## Complete stack
![Complete Stack](https://cdn.codetunnel.net/mocko/complete-arch.png)

### Mocko API
A NestJS application used by Mocko UI to manage Mocko resources, it
saves and reads the mocks from Redis as well as publishing a deploy
message when changes are made to any Mock. That way, all the mocko-proxies can load the new mock definitions from Redis to update
the routes.

### Mocko Proxy
The heart of Mocko. It's a Hapi application that receives the requests
from the user and provides mocks or proxies to the real API.

On startup or on deploy messages from Mocko API or from Mocko CLI, it
loads the mocks from the mocks dir and from Redis (if it's enabled in
the config), parses all the handlebars templates and maps all the
routes.

When it receives a request, it tries to match a mock route. If a mock is
found, it builds the handlebars context, processes the mock template and
responds with the result.

When no mocks are found, it proxies to your actual API and responds with
it's response.

## Standalone mode

On standalone mode, only mocko-proxy is present and it loads its mocks
from the mocks directory. Mocko-proxy can also be called from Mocko CLI:
![Complete Stack](https://cdn.codetunnel.net/mocko/cli-arch.png)

In that case, mocko-cli reads the settings from the admin and passes to
mocko-proxy. It also watches for file changes (when told to do so) and
notifies mocko-proxy with a deploy message.

# Running Mocko from the repository

As you've seen above, `mocko-proxy` is the main component so let's get
started with it. Clone Mocko's repository, navigate to `mocko-proxy` and
install its dependencies.
```shell
$ git clone https://github.com/mocko-app/mocko.git
$ cd mocko/mocko-proxy
$ npm install
```

Now create a sample mock file inside `mocko-proxy/mocks` and start
mocko-proxy (inside the `mocko-proxy` dir) with:
```shell
$ npm run start:dev
```

Now you're ready to contribute to Mocko! Some files that might be useful:

- `mocko-proxy/src/api/definition/definition.provider.ts`: Reads mocks from Redis
and the mocks dir
- `mocko-proxy/src/api/mock/data/mock-options.ts`: Converts the .hcl definitions to the internal Mock object
- `mocko-proxy/src/api/mock/mock.handler.ts`: Processes the request pipeline:
    - Builds handlebars context
    - Builds the response body from the template (with the context previously built)
    - Waits for the specified amount of millis
    - Proxies if the template told so
    - Builds the Hapi response
- `mocko-proxy/src/api/mock/mock.service.ts`: Registers custom Handlebars helpers

# Running tests
Run mocko-proxy tests with:
```shell
$ cd mocko-proxy
$ docker-compose up -d
$ npm test
$ docker-compose down
```

Run end-to-end tests with:
```shell
$ cd e2e-tests
$ docker-compose build
$ docker-compose up -d
$ npm test
$ docker-compose down
```
