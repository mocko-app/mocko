You're on Mocko, a dynamic HTTP mocking tool.

./mocko-core is the core project which receives HTTP requests, renders and returns responses or proxies to the user's backend. Mocks can be defined using Bigodon, a handlebars-like templating language.

./mocko-control is the control panel for Mocko, which allows users to manage their mocks.

./mocko-cli is the command-line interface for Mocko, which allows users to interact with Mocko from the terminal, it imports both mocko-core and mocko-control and exposes their functionalities.

./mocko-tests is the testing suite for Mocko, which contains tests for all the components of Mocko.

./package.json is the root workspace package.json file which defines the workspaces and dependencies for those projects.

mocko-control and mocko-core are deployed and upgraded independently: a user may run a newer control against an older core, or vice versa. Treat the HTTP contract between them as additive-only. Add new fields as optional, never remove or rename existing ones, and never delete an endpoint one side might still call. Control must tolerate missing new fields (older core) and ignore unknown ones (newer core). Prefer computing derived state inside control from fields core already sends over teaching core to report it, so a change ships without requiring both sides to upgrade together.

Avoid code comments. Only comment when the code cannot be made to speak for itself (a non-obvious workaround, a cross-file invariant, a subtle gotcha). Short comments are sometimes fine in tests to clarify intent. When in doubt, leave it out.

For full tests (build proxy, build control, run the control component tests and the mocko-tests suite) run `npm run test:full` from the root. When your change is purely frontend and doesn't touch any backend, you can run just `npm test --prefix ./mocko-control` (Vitest component tests, see mocko-control/AGENTS.md) plus `npm run build --prefix ./mocko-control` which already lints and builds, instead of the full suite.
