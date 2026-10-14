import { MockoClient } from '@mocko/sdk';
import {
  CaptureServer,
  createCaptureServer,
  createSubject,
  MockoInstance,
} from '../../harness';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('sdk callbacks', () => {
  let subject: MockoInstance;
  let capture: CaptureServer;
  let mocko: MockoClient;

  beforeAll(async () => {
    capture = await createCaptureServer();
    subject = await createSubject();
    mocko = new MockoClient(`http://127.0.0.1:${subject.port}`);
    await subject.createMock(`
      host "target" {
        source      = "target.local"
        destination = "${capture.url}"
      }

      callback "payment-approved" {
        host = "target"
        path = "/payments/{{payload.id}}"
        body = "{ \\"id\\": \\"{{payload.id}}\\" }"
      }
    `);
  });

  afterAll(async () => {
    await subject.stop();
    await capture.stop();
  });

  beforeEach(async () => {
    capture.clear();
    await mocko.clearPendingCallbacks();
  });

  it('fires a callback immediately with a payload', async () => {
    const pending = await mocko.fireCallback('payment-approved', {
      id: 'pay-42',
    });

    expect(pending.id).toBeDefined();
    expect(pending.slug).toBe('payment-approved');

    await capture.waitForRequests(1);
    expect(capture.requests[0].url).toBe('/payments/pay-42');
    expect(JSON.parse(capture.requests[0].body)).toEqual({ id: 'pay-42' });
  });

  it('schedules with a delay and fires early instead of sleeping', async () => {
    const scheduled = await mocko.fireCallback(
      'payment-approved',
      { id: 'pay-later' },
      { delay: 60_000 },
    );

    const pending = await mocko.listPendingCallbacks();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(scheduled.id);
    expect(pending[0].payload).toEqual({ id: 'pay-later' });
    expect(pending[0].dueAt - pending[0].createdAt).toBe(60_000);

    await mocko.firePendingCallback(scheduled.id);

    await capture.waitForRequests(1);
    expect(capture.requests[0].url).toBe('/payments/pay-later');
    expect(await mocko.listPendingCallbacks()).toHaveLength(0);
  });

  it('cancels a pending callback so it never fires', async () => {
    const scheduled = await mocko.fireCallback(
      'payment-approved',
      { id: 'pay-cancelled' },
      { delay: 700 },
    );

    await mocko.cancelPendingCallback(scheduled.id);
    expect(await mocko.listPendingCallbacks()).toHaveLength(0);

    await sleep(1500);
    expect(capture.requests).toHaveLength(0);
  });

  it('clears all pending callbacks', async () => {
    await mocko.fireCallback('payment-approved', null, { delay: 60_000 });
    await mocko.fireCallback('payment-approved', null, { delay: 60_000 });

    await mocko.clearPendingCallbacks();
    expect(await mocko.listPendingCallbacks()).toHaveLength(0);
  });

  describe('held callbacks', () => {
    async function scheduleAndHold(id: string): Promise<string> {
      const scheduled = await mocko.fireCallback(
        'payment-approved',
        { id },
        { delay: 60_000 },
      );
      const held = await subject.client.post(
        `/__mocko__/callbacks/pending/${scheduled.id}/hold`,
      );
      expect(held.status).toBe(200);
      return scheduled.id;
    }

    it('lists held callbacks with heldAt', async () => {
      const heldId = await scheduleAndHold('pay-held');
      const scheduled = await mocko.fireCallback(
        'payment-approved',
        { id: 'pay-scheduled' },
        { delay: 60_000 },
      );

      const pending = await mocko.listPendingCallbacks();
      expect(pending).toHaveLength(2);
      const held = pending.find((item) => item.id === heldId);
      const notHeld = pending.find((item) => item.id === scheduled.id);
      expect(held?.heldAt).toEqual(expect.any(Number));
      expect(notHeld?.heldAt).toBeUndefined();
    });

    it('fires a held callback', async () => {
      const heldId = await scheduleAndHold('pay-held-fired');

      await mocko.firePendingCallback(heldId);

      await capture.waitForRequests(1);
      expect(capture.requests[0].url).toBe('/payments/pay-held-fired');
      expect(await mocko.listPendingCallbacks()).toHaveLength(0);
    });

    it('cancels a held callback', async () => {
      const heldId = await scheduleAndHold('pay-held-cancelled');

      await mocko.cancelPendingCallback(heldId);

      expect(await mocko.listPendingCallbacks()).toHaveLength(0);
      await sleep(300);
      expect(capture.requests).toHaveLength(0);
    });

    it('clears held callbacks', async () => {
      await scheduleAndHold('pay-held-cleared');

      await mocko.clearPendingCallbacks();

      expect(await mocko.listPendingCallbacks()).toHaveLength(0);
    });
  });

  it('throws a descriptive error for unknown slugs', async () => {
    await expect(mocko.fireCallback('nope')).rejects.toThrow(
      'Mocko failed to fire callback "nope": HTTP 404',
    );
  });
});
