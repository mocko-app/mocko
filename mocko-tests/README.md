# mocko-tests

Integration tests for Mocko. Spawns real `mocko-cli` processes and exercises them over HTTP.

## Running

From the repo root (installs all workspaces):

```sh
npm install
```

Then run the tests:

```sh
cd mocko-tests
npm test
```

`pretest` automatically builds `mocko-core` before running.

Redis-specific suites are included in the Jest tree but skip by default unless
`REDIS_TESTS_ENABLED=true`.

To run only the Redis suites:

```sh
cd mocko-tests
npm run test:redis
```

`test:redis` is strict: it assumes a Redis server is available and fails if it
cannot connect. By default the Redis harness uses `127.0.0.1:6379`, database
`15`, and flushes that database before and after each Redis suite.

## Writing tests

Import the harness from `src/harness`:

```ts
import {
  createSubject,
  createContent,
  randomPath,
  MockoInstance,
  CONTENT_PORT,
} from '../../harness';
```

### `createSubject(options?)`

Spawns a `mocko-cli` instance with `--watch` enabled on a random port (counter starting at 6651). Returns a `MockoInstance`.

```ts
let subject: MockoInstance;

beforeAll(async () => {
  subject = await createSubject();
});
afterAll(async () => {
  await subject.stop();
});
```

### `createContent()`

Spawns a `mocko-cli` instance on the fixed port `6650` (used as the upstream for proxy tests).

### `subject.createMock(hcl)`

Writes an HCL mock definition to the instance's temp directory and waits for the server to reload:

```ts
const path = randomPath();

await subject.createMock(`
  mock "GET ${path}" {
    body = "hello"
  }
`);

const { data } = await subject.client.get(path);
```

### `subject.client`

An `axios` instance pre-configured with the instance's base URL. `validateStatus` is set to always return `true` so you can assert on any status code.

### `randomPath()`

Returns a random URL path (e.g. `/test-a3f9bc12`) to avoid route collisions between tests in the same suite.
