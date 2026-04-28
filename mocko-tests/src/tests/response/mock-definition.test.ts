import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createSubject, MockoInstance, randomPath } from '../../harness';

describe('mock definition', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('sets headers with the headers param', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        headers {
          x-custom-header = "foo"
        }
      }
    `);

    const res = await subject.client.get(path);
    expect(res.headers['x-custom-header']).toBe('foo');
  });

  it('sets the body with the body param', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "Hello from Mocko :)"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.data).toBe('Hello from Mocko :)');
  });

  it('delays with the delay param', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        delay = 200
      }
    `);

    const start = Date.now();
    await subject.client.get(path);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(180);
    expect(elapsed).toBeLessThan(500);
  });

  it('ignores files starting with a dot', async () => {
    const route = randomPath();
    const revision = await subject.getRevision();
    await fs.writeFile(
      path.join(subject.dir, '.dotfile.hcl'),
      `mock "GET ${route}" { body = "should not be served" }`,
    );
    await subject.waitForRemap(revision);

    const res = await subject.client.get(route);
    expect(res.status).toBe(404);
  });

  it('ignores directories starting with a dot', async () => {
    const route = randomPath();
    const hiddenDir = path.join(subject.dir, '.hidden');
    const revision = await subject.getRevision();
    await fs.mkdir(hiddenDir);
    await fs.writeFile(
      path.join(hiddenDir, 'nested.hcl'),
      `mock "GET ${route}" { body = "should not be served" }`,
    );
    await subject.waitForRemap(revision);

    const res = await subject.client.get(route);
    expect(res.status).toBe(404);
  });
});
