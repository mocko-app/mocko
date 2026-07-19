import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createSubject, MockoInstance } from '../../harness';

describe('callback route authorization', () => {
  let subject: MockoInstance;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('allows trigger and pending routes without authorization in deploy mode', async () => {
    subject = new MockoInstance(
      { '--ui': true },
      { MANAGEMENT_AUTH_MODE: 'deploy' },
    );
    await subject.prepare();
    await fs.writeFile(
      path.join(subject.dir, 'callbacks.hcl'),
      `
      callback "payment-approved" {
        url   = "http://localhost:9998/payments"
        delay = 60000
      }
    `,
    );
    await subject.start();

    const fireRes = await subject.client.post(
      '/__mocko__/callbacks/payment-approved/fire',
      { delay: 60_000 },
    );
    expect(fireRes.status).toBe(202);

    const pendingRes = await subject.client.get('/__mocko__/callbacks/pending');
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.data).toHaveLength(1);

    const clearRes = await subject.client.delete(
      '/__mocko__/callbacks/pending',
    );
    expect(clearRes.status).toBe(204);

    const listRes = await subject.client.get('/__mocko__/callbacks');
    expect(listRes.status).toBe(401);
  });

  it('requires authorization when management auth mode is all', async () => {
    subject = await createSubject(
      {},
      { MANAGEMENT_AUTH_MODE: 'all', DEPLOY_SECRET: 'secret' },
    );
    await subject.createMock(`
      callback "payment-approved" {
        url   = "http://localhost:9998/payments"
        delay = 60000
      }
    `);

    const unauthorizedFire = await subject.client.post(
      '/__mocko__/callbacks/payment-approved/fire',
      { delay: 60_000 },
    );
    expect(unauthorizedFire.status).toBe(401);

    const unauthorizedPending = await subject.client.get(
      '/__mocko__/callbacks/pending',
    );
    expect(unauthorizedPending.status).toBe(401);

    const headers = { Authorization: 'Bearer secret' };
    const fireRes = await subject.client.post(
      '/__mocko__/callbacks/payment-approved/fire',
      { delay: 60_000 },
      { headers },
    );
    expect(fireRes.status).toBe(202);

    const pendingRes = await subject.client.get(
      '/__mocko__/callbacks/pending',
      { headers },
    );
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.data).toHaveLength(1);
  });
});
