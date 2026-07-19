import {
  CaptureServer,
  createCaptureServer,
  createSubject,
  MockoInstance,
} from '../../harness';

function findCallback(list: any[], slug: string) {
  const callback = list.find((item) => item.slug === slug);
  expect(callback).toBeTruthy();
  return callback;
}

describe('control callbacks integration', () => {
  let subject: MockoInstance;
  let capture: CaptureServer;

  beforeAll(async () => {
    capture = await createCaptureServer();
  });

  afterAll(async () => {
    await capture.stop();
  });

  beforeEach(() => {
    capture.clear();
  });

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('lists file-defined callbacks as read-only and rejects editing them', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await subject.createMock(`
      host "target" {
        source      = "target.local"
        destination = "${capture.url}"
      }

      callback "payment-approved" {
        name = "Payment approved"
        host = "target"
        path = "/payments/{{payload.key}}"
        delay = 1500
        body = "{}"
      }
    `);

    const listRes = await control.get('/api/callbacks');
    expect(listRes.status).toBe(200);
    const fileCallback = findCallback(listRes.data, 'payment-approved');
    expect(fileCallback.name).toBe('Payment approved');
    expect(fileCallback.method).toBe('POST');
    expect(fileCallback.host).toBe('target');
    expect(fileCallback.path).toBe('/payments/{{payload.key}}');
    expect(fileCallback.delay).toBe(1500);
    expect(fileCallback.annotations).toContain('READ_ONLY');

    const detailsRes = await control.get('/api/callbacks/payment-approved');
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.body).toBe('{}');
    expect(detailsRes.data.annotations).toEqual(['READ_ONLY']);

    const patchRes = await control.patch('/api/callbacks/payment-approved', {
      method: 'POST',
      url: 'http://localhost:1/nope',
    });
    expect(patchRes.status).toBe(409);
    expect(patchRes.data.code).toBe('CALLBACK_READ_ONLY');

    const deleteRes = await control.delete('/api/callbacks/payment-approved');
    expect(deleteRes.status).toBe(409);
    expect(deleteRes.data.code).toBe('CALLBACK_READ_ONLY');

    const duplicateRes = await control.post('/api/callbacks', {
      slug: 'payment-approved',
      url: 'http://localhost:1/dup',
    });
    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.data.code).toBe('CALLBACK_SLUG_CONFLICT');
  });

  it('creates, fires, updates, and deletes ui callbacks in storeless mode', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const createRes = await control.post('/api/callbacks', {
      slug: 'order-shipped',
      name: 'Order shipped',
      method: 'PUT',
      url: `${capture.url}/orders/{{payload.id}}`,
      headers: { 'X-Source': 'mocko' },
      body: '{ "id": "{{payload.id}}" }',
    });
    expect(createRes.status).toBe(201);
    expect(createRes.data.annotations).toContain('TEMPORARY');

    const fireRes = await control.post('/api/callbacks/order-shipped/fire', {
      payload: { id: '42' },
    });
    expect(fireRes.status).toBe(202);

    await capture.waitForRequests(1);
    const [request] = capture.requests;
    expect(request.method).toBe('PUT');
    expect(request.url).toBe('/orders/42');
    expect(request.headers['x-source']).toBe('mocko');
    expect(JSON.parse(request.body)).toEqual({ id: '42' });

    const updateRes = await control.patch('/api/callbacks/order-shipped', {
      name: 'Order shipped v2',
      method: 'POST',
      url: `${capture.url}/v2/orders`,
      delay: 250,
      headers: {},
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.data.name).toBe('Order shipped v2');
    expect(updateRes.data.delay).toBe(250);

    capture.clear();
    await control.post('/api/callbacks/order-shipped/fire', {});
    await capture.waitForRequests(1);
    expect(capture.requests[0].method).toBe('POST');
    expect(capture.requests[0].url).toBe('/v2/orders');

    const deleteRes = await control.delete('/api/callbacks/order-shipped');
    expect(deleteRes.status).toBe(204);
    expect((await control.get('/api/callbacks/order-shipped')).status).toBe(
      404,
    );
    expect(
      (await control.post('/api/callbacks/order-shipped/fire', {})).status,
    ).toBe(404);
  });

  it('manages pending callbacks through the control api', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const createRes = await control.post('/api/callbacks', {
      slug: 'slow-callback',
      url: `${capture.url}/slow`,
    });
    expect(createRes.status).toBe(201);

    await control.post('/api/callbacks/slow-callback/fire', {
      payload: 'LATER',
      delay: 60_000,
    });

    const pendingRes = await control.get('/api/callbacks/pending');
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.data.isSupported).toBe(true);
    expect(pendingRes.data.pending).toHaveLength(1);
    const [pending] = pendingRes.data.pending;
    expect(pending.slug).toBe('slow-callback');
    expect(pending.payload).toBe('LATER');

    const fireNowRes = await control.post(
      `/api/callbacks/pending/${pending.id}/fire`,
    );
    expect(fireNowRes.status).toBe(202);
    await capture.waitForRequests(1);
    expect(capture.requests[0].url).toBe('/slow');

    await control.post('/api/callbacks/slow-callback/fire', { delay: 60_000 });
    const cancelTarget = (await control.get('/api/callbacks/pending')).data
      .pending[0];
    const cancelRes = await control.delete(
      `/api/callbacks/pending/${cancelTarget.id}`,
    );
    expect(cancelRes.status).toBe(204);

    await control.post('/api/callbacks/slow-callback/fire', { delay: 60_000 });
    await control.post('/api/callbacks/slow-callback/fire', { delay: 60_000 });
    const clearRes = await control.delete('/api/callbacks/pending');
    expect(clearRes.status).toBe(204);
    expect((await control.get('/api/callbacks/pending')).data.pending).toEqual(
      [],
    );
  });

  it('returns validation errors for callback management routes', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    expect((await control.get('/api/callbacks/missing')).status).toBe(404);
    expect((await control.delete('/api/callbacks/missing')).status).toBe(404);

    const noTargetRes = await control.post('/api/callbacks', {
      slug: 'no-target',
    });
    expect(noTargetRes.status).toBe(400);
    expect(noTargetRes.data.code).toBe('BAD_REQUEST');

    const bothTargetsRes = await control.post('/api/callbacks', {
      slug: 'both-targets',
      host: 'target',
      path: '/path',
      url: 'http://localhost:1/url',
    });
    expect(bothTargetsRes.status).toBe(400);

    const badTemplateRes = await control.post('/api/callbacks', {
      slug: 'bad-template',
      url: 'http://localhost:1/url',
      body: '{{#if}',
    });
    expect(badTemplateRes.status).toBe(400);
    expect(badTemplateRes.data.code).toBe('TEMPLATE_PARSE_ERROR');

    const createRes = await control.post('/api/callbacks', {
      slug: 'validate',
      url: 'http://localhost:1/url',
    });
    expect(createRes.status).toBe(201);

    const slugPatchRes = await control.patch('/api/callbacks/validate', {
      slug: 'other',
    });
    expect(slugPatchRes.status).toBe(400);
    expect(slugPatchRes.data.code).toBe('BAD_REQUEST');
  });
});
