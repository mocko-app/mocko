import {
  CaptureServer,
  createCaptureServer,
  createSubject,
  MockoInstance,
} from '../../harness';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('callback delivery (storeless)', () => {
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
        headers {
          X-Callback-Type = "{{payload.type}}"
        }
        body = "{ \\"key\\": \\"{{payload.key}}\\" }"
      }

      callback "custom-content-type" {
        method = "PUT"
        host   = "target"
        path   = "/typed"
        headers {
          Content-Type = "text/plain"
        }
        body = "plain {{payload}}"
      }

      callback "absolute-url" {
        url  = "${capture.url}/absolute/{{payload.id}}"
        body = "{}"
      }

      callback "sets-flag" {
        host = "target"
        path = "/flagged"
        body = "{{setFlag 'callbacks:delivered' payload}}"
      }

      callback "render-crash" {
        host = "target"
        path = "/crash"
        body = "{{getFlag 5}}"
      }

      callback "no-destination" {
        host = "sourceless"
        path = "/never"
      }

      callback "chained" {
        host = "target"
        path = "/chained"
        body = "{{callback 'payment-approved'}}"
      }

      callback "with-data" {
        host = "target"
        path = "/with-data"
        body = "{ \\"region\\": \\"{{data.billing.region}}\\" }"
      }

      host "sourceless" {
        source = "sourceless.local"
      }

      data "billing" {
        region = "us-east"
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

  it('delivers a fired callback with rendered path, headers and body', async () => {
    const res = await subject.client.post(
      '/__mocko__/callbacks/payment-approved/fire',
      { payload: { key: 'john.doe@mocko.dev', type: 'EMAIL' } },
    );

    expect(res.status).toBe(202);
    expect(res.data.id).toBeDefined();
    expect(res.data.slug).toBe('payment-approved');

    await capture.waitForRequests(1);
    const [request] = capture.requests;
    expect(request.method).toBe('POST');
    expect(request.url).toBe('/payments/john.doe@mocko.dev');
    expect(request.headers['x-callback-type']).toBe('EMAIL');
    expect(request.headers['content-type']).toBe('application/json');
    expect(JSON.parse(request.body)).toEqual({ key: 'john.doe@mocko.dev' });
  });

  it('keeps an explicit Content-Type header', async () => {
    await subject.client.post('/__mocko__/callbacks/custom-content-type/fire', {
      payload: 'text',
    });

    await capture.waitForRequests(1);
    const [request] = capture.requests;
    expect(request.method).toBe('PUT');
    expect(request.url).toBe('/typed');
    expect(request.headers['content-type']).toBe('text/plain');
    expect(request.body).toBe('plain text');
  });

  it('delivers to templated absolute urls', async () => {
    await subject.client.post('/__mocko__/callbacks/absolute-url/fire', {
      payload: { id: '42' },
    });

    await capture.waitForRequests(1);
    expect(capture.requests[0].url).toBe('/absolute/42');
  });

  it('honors the fire delay', async () => {
    await subject.client.post('/__mocko__/callbacks/payment-approved/fire', {
      payload: { key: 'delayed' },
      delay: 800,
    });

    await sleep(300);
    expect(capture.requests).toHaveLength(0);

    await capture.waitForRequests(1, 3000);
    expect(capture.requests[0].url).toBe('/payments/delayed');
  });

  it('runs side-effect helpers at delivery time', async () => {
    await subject.client.post('/__mocko__/callbacks/sets-flag/fire', {
      payload: 'DONE',
      delay: 600,
    });

    const before = await subject.client.get(
      '/__mocko__/flags/callbacks%3Adelivered',
    );
    expect(before.status).toBe(404);

    await capture.waitForRequests(1, 3000);
    const after = await subject.client.get(
      '/__mocko__/flags/callbacks%3Adelivered',
    );
    expect(JSON.parse(after.data.value)).toBe('DONE');
  });

  it('returns 404 when firing an unknown slug', async () => {
    const res = await subject.client.post('/__mocko__/callbacks/nope/fire', {});
    expect(res.status).toBe(404);
  });

  it('returns 422 when the target host has no destination', async () => {
    const res = await subject.client.post(
      '/__mocko__/callbacks/no-destination/fire',
      {},
    );
    expect(res.status).toBe(422);
  });

  it('rejects negative delays', async () => {
    const res = await subject.client.post(
      '/__mocko__/callbacks/payment-approved/fire',
      { delay: -1 },
    );
    expect(res.status).toBe(400);
  });

  it('renders data blocks in callback bodies at delivery time', async () => {
    await subject.client.post('/__mocko__/callbacks/with-data/fire', {});

    await capture.waitForRequests(1);
    expect(capture.requests[0].url).toBe('/with-data');
    expect(JSON.parse(capture.requests[0].body)).toEqual({
      region: 'us-east',
    });
  });

  it('drops a callback whose body tries to chain another callback', async () => {
    await subject.client.post('/__mocko__/callbacks/chained/fire', {});

    await sleep(1000);
    expect(capture.requests).toHaveLength(0);
    const pending = await subject.client.get('/__mocko__/callbacks/pending');
    expect(pending.data).toHaveLength(0);
    expect(subject.hasCrashed()).toBe(false);
  });

  it('drops the callback without crashing when rendering fails', async () => {
    await subject.client.post('/__mocko__/callbacks/render-crash/fire', {});

    await sleep(1000);
    expect(capture.requests).toHaveLength(0);
    expect(subject.hasCrashed()).toBe(false);
  });

  describe('pending management', () => {
    it('lists pending callbacks with due time and payload', async () => {
      const fired = await subject.client.post(
        '/__mocko__/callbacks/payment-approved/fire',
        { payload: { key: 'pending' }, delay: 60_000 },
      );

      const res = await subject.client.get('/__mocko__/callbacks/pending');
      expect(res.status).toBe(200);
      expect(res.data).toHaveLength(1);
      expect(res.data[0]).toMatchObject({
        id: fired.data.id,
        slug: 'payment-approved',
        payload: { key: 'pending' },
      });
      expect(res.data[0].dueAt).toBeGreaterThan(Date.now() + 30_000);
    });

    it('fires a pending callback immediately', async () => {
      const fired = await subject.client.post(
        '/__mocko__/callbacks/payment-approved/fire',
        { payload: { key: 'fire-now' }, delay: 60_000 },
      );

      const res = await subject.client.post(
        `/__mocko__/callbacks/pending/${fired.data.id}/fire`,
      );
      expect(res.status).toBe(202);

      await capture.waitForRequests(1);
      expect(capture.requests[0].url).toBe('/payments/fire-now');

      const pending = await subject.client.get('/__mocko__/callbacks/pending');
      expect(pending.data).toHaveLength(0);
    });

    it('cancels a pending callback', async () => {
      const fired = await subject.client.post(
        '/__mocko__/callbacks/payment-approved/fire',
        { payload: { key: 'cancelled' }, delay: 700 },
      );

      const res = await subject.client.delete(
        `/__mocko__/callbacks/pending/${fired.data.id}`,
      );
      expect(res.status).toBe(204);

      await sleep(1500);
      expect(capture.requests).toHaveLength(0);
    });

    it('clears all pending callbacks', async () => {
      await subject.client.post('/__mocko__/callbacks/payment-approved/fire', {
        delay: 60_000,
      });
      await subject.client.post('/__mocko__/callbacks/absolute-url/fire', {
        delay: 60_000,
      });

      const res = await subject.client.delete('/__mocko__/callbacks/pending');
      expect(res.status).toBe(204);

      const pending = await subject.client.get('/__mocko__/callbacks/pending');
      expect(pending.data).toHaveLength(0);
    });

    it('returns 404 for unknown pending ids', async () => {
      const fire = await subject.client.post(
        '/__mocko__/callbacks/pending/unknown-id/fire',
      );
      const cancel = await subject.client.delete(
        '/__mocko__/callbacks/pending/unknown-id',
      );

      expect(fire.status).toBe(404);
      expect(cancel.status).toBe(404);
    });
  });
});

describe('callback render-at-fire semantics (storeless)', () => {
  let subject: MockoInstance;
  let capture: CaptureServer;
  let filename: string;

  const definitionWith = (body: string, capture: CaptureServer) => `
    host "target" {
      source      = "target.local"
      destination = "${capture.url}"
    }

    callback "mutable" {
      host = "target"
      path = "/mutable"
      body = "${body}"
    }
  `;

  beforeAll(async () => {
    capture = await createCaptureServer();
    subject = await createSubject();
    filename = await subject.createMock(definitionWith('version one', capture));
  });

  afterAll(async () => {
    await subject.stop();
    await capture.stop();
  });

  it('renders with the definition current at fire time, not at schedule time', async () => {
    await subject.client.post('/__mocko__/callbacks/mutable/fire', {
      delay: 1200,
    });

    await subject.writeFileAndWaitForRemap(
      filename,
      definitionWith('version two', capture),
    );

    await capture.waitForRequests(1, 4000);
    expect(capture.requests[0].body).toBe('version two');
  });

  it('drops pending callbacks whose definition was removed', async () => {
    await subject.client.post('/__mocko__/callbacks/mutable/fire', {
      delay: 800,
    });

    await subject.writeFileAndWaitForRemap(
      filename,
      `
      host "target" {
        source      = "target.local"
        destination = "${capture.url}"
      }
    `,
    );

    capture.clear();
    await sleep(2000);
    expect(capture.requests).toHaveLength(0);
    expect(subject.hasCrashed()).toBe(false);
  });
});
