import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { MockoInstance } from '../../harness';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('watch disabled', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = new MockoInstance({});
    await subject.prepare();
    await fs.writeFile(
      path.join(subject.dir, 'initial.hcl'),
      `mock "GET /watch-off-before" { body = "before" }`,
    );
    await subject.start();
  });

  afterAll(() => subject.stop());

  it('serves mocks that existed at startup', async () => {
    const res = await subject.client.get('/watch-off-before');
    expect(res.data).toBe('before');
  });

  it('does not pick up files added after startup', async () => {
    await fs.writeFile(
      path.join(subject.dir, 'after.hcl'),
      `mock "GET /watch-off-after" { body = "after" }`,
    );
    await sleep(200);
    const res = await subject.client.get('/watch-off-after');
    expect(res.status).toBe(404);
  });
});
