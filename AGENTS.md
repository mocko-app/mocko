You're on Mocko, a dynamic HTTP mocking tool.

./mocko-proxy (soon mocko-core) is the core project which receives HTTP requests, renders and returns responses or proxies to the user's backend. Mocks can be defined using Bigodon, a handlebars-like templating language.

./mocko-control is the control panel for Mocko, which allows users to manage their mocks.

./mocko-cli is the command-line interface for Mocko, which allows users to interact with Mocko from the terminal, it imports both mocko-proxy and mocko-control and exposes their functionalities.

./mocko-tests is the testing suite for Mocko, which contains tests for all the components of Mocko.

./package.json is the root workspace package.json file which defines the workspaces and dependencies for those projects.

For full tests (build proxy, build control, run tests) you can run `npm test --prefix ./mocko-tests`. After UI changes on control there is no need to test, just check `npm run build --prefix ./mocko-control` which already lints and builds.
