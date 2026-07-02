You're on Mocko, a dynamic HTTP mocking tool.

./mocko-core is the core project which receives HTTP requests, renders and returns responses or proxies to the user's backend. Mocks can be defined using Bigodon, a handlebars-like templating language.

./mocko-control is the control panel for Mocko, which allows users to manage their mocks.

./mocko-cli is the command-line interface for Mocko, which allows users to interact with Mocko from the terminal, it imports both mocko-core and mocko-control and exposes their functionalities.

./mocko-tests is the testing suite for Mocko, which contains tests for all the components of Mocko.

./package.json is the root workspace package.json file which defines the workspaces and dependencies for those projects.

For full tests (build proxy, build control, run the control component tests and the mocko-tests suite) run `npm run test:full` from the root. When your change is purely frontend and doesn't touch any backend, you can run just `npm test --prefix ./mocko-control` (Vitest component tests, see mocko-control/AGENTS.md) plus `npm run build --prefix ./mocko-control` which already lints and builds, instead of the full suite.
