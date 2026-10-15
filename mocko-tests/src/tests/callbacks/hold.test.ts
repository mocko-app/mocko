import {
  CaptureServer,
  createCaptureServer,
  createSubject,
  MockoInstance,
} from '../../harness';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('held callbacks (storeless)', () => {
  let subject: MockoInstance;
  let capture: CaptureServer;

  beforeAll(async () => {
    capture = await createCaptureServer();
    subject = await createSubject();
    await subject.createMock(`
      host "target" {
        source      = "target.local"
        destination = "${capture.url}"
      }

      callback "payment-approved" {
        host = "target"
        path = "/payments/{{payload.key}}"
        body = "{ \\"key\\": \\"{{payload.key}}\\" }"
      }
    `);
  });

  afterAll(async () => {
    await subject.stop();
    await capture.stop();
  });

  beforeEach(async () => {
    capture.clear();
    await subject.client.delete('/__mocko__/callbacks/pending');
  });

  async function schedule(key: string, delay: number): Promise<string> {
    const res = await subject.client.post(
      '/__mocko__/callbacks/payment-approved/fire',
      { payload: { key }, delay },
    );
    expect(res.status).toBe(202);
    return res.data.id;
  }

  async function hold(id: string) {
    return await subject.client.post(`/__mocko__/callbacks/pending/${id}/hold`);
  }

  async function listPending() {
    return (await subject.client.get('/__mocko__/callbacks/pending')).data;
  }

  it('advertises the callback-hold capability on health', async () => {
    const res = await subject.client.get('/__mocko__/health');
    expect(res.status).toBe(200);
    expect(res.data.capabilities).toContain('callback-hold');
  });

  it('keeps a held callback listed and undelivered past its due time', async () => {
    const id = await schedule('held', 600);
    const before = Date.now();

    const res = await hold(id);
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      id,
      slug: 'payment-approved',
      payload: { key: 'held' },
    });
    expect(res.data.heldAt).toBeGreaterThanOrEqual(before);
    expect(res.data.heldAt).toBeLessThanOrEqual(Date.now());

    await sleep(1500);
    expect(capture.requests).toHaveLength(0);

    const pending = await listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ id, heldAt: res.data.heldAt });
    expect(pending[0].dueAt).toBeLessThan(Date.now());
  });

  it('omits heldAt for scheduled callbacks', async () => {
    await schedule('scheduled', 60_000);

    const pending = await listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]).not.toHaveProperty('heldAt');
  });

  it('fires a held callback once and removes it', async () => {
    const id = await schedule('fire-held', 60_000);
    await hold(id);

    const fire = await subject.client.post(
      `/__mocko__/callbacks/pending/${id}/fire`,
    );
    expect(fire.status).toBe(202);

    await capture.waitForRequests(1);
    expect(capture.requests[0].url).toBe('/payments/fire-held');
    expect(await listPending()).toHaveLength(0);

    const again = await subject.client.post(
      `/__mocko__/callbacks/pending/${id}/fire`,
    );
    expect(again.status).toBe(404);
    await sleep(300);
    expect(capture.requests).toHaveLength(1);
  });

  it('cancels a held callback without delivering it', async () => {
    const id = await schedule('cancel-held', 500);
    await hold(id);

    const cancel = await subject.client.delete(
      `/__mocko__/callbacks/pending/${id}`,
    );
    expect(cancel.status).toBe(204);
    expect(await listPending()).toHaveLength(0);

    await sleep(1000);
    expect(capture.requests).toHaveLength(0);
  });

  it('clears held callbacks along with scheduled ones', async () => {
    const heldId = await schedule('clear-held', 60_000);
    await hold(heldId);
    await schedule('clear-scheduled', 60_000);

    const clear = await subject.client.delete('/__mocko__/callbacks/pending');
    expect(clear.status).toBe(204);
    expect(await listPending()).toHaveLength(0);
  });

  it('returns 404 when holding an unknown id', async () => {
    const res = await hold('unknown-id');
    expect(res.status).toBe(404);
  });

  it('returns 409 when holding an already held callback', async () => {
    const id = await schedule('twice', 60_000);
    const first = await hold(id);
    expect(first.status).toBe(200);

    const second = await hold(id);
    expect(second.status).toBe(409);

    const pending = await listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].heldAt).toBe(first.data.heldAt);
  });

  it('keeps delivering scheduled callbacks while another one is held', async () => {
    const heldId = await schedule('stays-held', 300);
    await hold(heldId);
    await schedule('delivered', 300);

    await capture.waitForRequests(1, 3000);
    await sleep(500);
    expect(capture.requests.map((request) => request.url)).toEqual([
      '/payments/delivered',
    ]);
    expect((await listPending()).map((item: any) => item.id)).toEqual([heldId]);
  });
});

describe('fire now pre-check (storeless)', () => {
  let subject: MockoInstance;
  let capture: CaptureServer;
  let filename: string;

  const host = (destination: string | null) => `
    host "target" {
      source = "target.local"
      ${destination ? `destination = "${destination}"` : ''}
    }
  `;
  const callback = `
    callback "fragile" {
      host = "target"
      path = "/fragile/{{payload}}"
      body = "{}"
    }
  `;

  beforeAll(async () => {
    capture = await createCaptureServer();
    subject = await createSubject();
    filename = await subject.createMock(host(capture.url) + callback);
  });

  afterAll(async () => {
    await subject.stop();
    await capture.stop();
  });

  beforeEach(async () => {
    capture.clear();
    await subject.client.delete('/__mocko__/callbacks/pending');
  });

  async function scheduleScheduledAndHeld(): Promise<[string, string]> {
    const scheduled = await subject.client.post(
      '/__mocko__/callbacks/fragile/fire',
      { payload: 'scheduled', delay: 60_000 },
    );
    const held = await subject.client.post(
      '/__mocko__/callbacks/fragile/fire',
      { payload: 'held', delay: 60_000 },
    );
    await subject.client.post(
      `/__mocko__/callbacks/pending/${held.data.id}/hold`,
    );
    return [scheduled.data.id, held.data.id];
  }

  async function pendingIds(): Promise<string[]> {
    const res = await subject.client.get('/__mocko__/callbacks/pending');
    return res.data.map((item: { id: string }) => item.id).sort();
  }

  it('refuses to fire when the definition was removed and keeps the callbacks', async () => {
    const ids = await scheduleScheduledAndHeld();
    await subject.writeFileAndRemap(filename, host(capture.url));

    for (const id of ids) {
      const res = await subject.client.post(
        `/__mocko__/callbacks/pending/${id}/fire`,
      );
      expect(res.status).toBe(422);
      expect(res.data.message).toBe("No callback found with slug 'fragile'");
    }

    expect(await pendingIds()).toEqual([...ids].sort());
    const held = (
      await subject.client.get('/__mocko__/callbacks/pending')
    ).data.find((item: { id: string }) => item.id === ids[1]);
    expect(held.heldAt).toEqual(expect.any(Number));

    await subject.writeFileAndRemap(filename, host(capture.url) + callback);
    const fired = await subject.client.post(
      `/__mocko__/callbacks/pending/${ids[1]}/fire`,
    );
    expect(fired.status).toBe(202);
    await capture.waitForRequests(1);
    expect(capture.requests[0].url).toBe('/fragile/held');
  });

  it('refuses to fire when the host lost its destination and keeps the callbacks', async () => {
    const ids = await scheduleScheduledAndHeld();
    await subject.writeFileAndRemap(filename, host(null) + callback);

    for (const id of ids) {
      const res = await subject.client.post(
        `/__mocko__/callbacks/pending/${id}/fire`,
      );
      expect(res.status).toBe(422);
    }

    expect(await pendingIds()).toEqual([...ids].sort());
    await sleep(300);
    expect(capture.requests).toHaveLength(0);

    await subject.writeFileAndRemap(filename, host(capture.url) + callback);
  });
});
