import * as path from 'node:path';
import {
  CaptureServer,
  createCaptureServer,
  createSubject,
  MockoInstance,
} from '../../harness';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function normalizeFilePath(subject: MockoInstance, filePath: string) {
  return path.relative(subject.dir, filePath).replace(/\\/g, '/');
}

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

    const filePath = await subject.createMock(`
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
    expect(fileCallback.id).toEqual(expect.any(String));
    expect(fileCallback.filePath).toBe(normalizeFilePath(subject, filePath));

    const detailsRes = await control.get(`/api/callbacks/${fileCallback.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.id).toBe(fileCallback.id);
    expect(detailsRes.data.body).toBe('{}');
    expect(detailsRes.data.filePath).toBe(normalizeFilePath(subject, filePath));
    expect(detailsRes.data.annotations).toEqual(['READ_ONLY']);
    expect(detailsRes.data.conflict).toBeNull();

    expect((await control.get('/api/callbacks/payment-approved')).status).toBe(
      404,
    );

    const patchRes = await control.patch(`/api/callbacks/${fileCallback.id}`, {
      method: 'POST',
      url: 'http://localhost:1/nope',
    });
    expect(patchRes.status).toBe(409);
    expect(patchRes.data.code).toBe('CALLBACK_READ_ONLY');

    const deleteRes = await control.delete(`/api/callbacks/${fileCallback.id}`);
    expect(deleteRes.status).toBe(409);
    expect(deleteRes.data.code).toBe('CALLBACK_READ_ONLY');

    const duplicateRes = await control.post('/api/callbacks', {
      slug: 'payment-approved',
      url: 'http://localhost:1/dup',
    });
    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.data.code).toBe('CALLBACK_SLUG_CONFLICT');

    const casedDuplicateRes = await control.post('/api/callbacks', {
      slug: 'Payment-Approved',
      url: 'http://localhost:1/dup',
    });
    expect(casedDuplicateRes.status).toBe(409);
    expect(casedDuplicateRes.data.code).toBe('CALLBACK_SLUG_CONFLICT');
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
    expect(createRes.data.id).toMatch(UUID_V4_PATTERN);
    const callbackId = createRes.data.id;

    const listRes = await control.get('/api/callbacks');
    expect(findCallback(listRes.data, 'order-shipped').id).toBe(callbackId);

    const bySlugRes = await control.get('/api/callbacks/order-shipped');
    expect(bySlugRes.status).toBe(404);
    expect(bySlugRes.data.code).toBe('CALLBACK_NOT_FOUND');
    expect(
      (await control.post('/api/callbacks/order-shipped/fire', {})).status,
    ).toBe(404);

    const fireRes = await control.post(`/api/callbacks/${callbackId}/fire`, {
      payload: { id: '42' },
    });
    expect(fireRes.status).toBe(202);

    await capture.waitForRequests(1);
    const [request] = capture.requests;
    expect(request.method).toBe('PUT');
    expect(request.url).toBe('/orders/42');
    expect(request.headers['x-source']).toBe('mocko');
    expect(JSON.parse(request.body)).toEqual({ id: '42' });

    const updateRes = await control.patch(`/api/callbacks/${callbackId}`, {
      name: 'Order shipped v2',
      method: 'POST',
      url: `${capture.url}/v2/orders`,
      delay: 250,
      headers: {},
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.data.id).toBe(callbackId);
    expect(updateRes.data.name).toBe('Order shipped v2');
    expect(updateRes.data.delay).toBe(250);
    expect(updateRes.data.conflict).toBeNull();

    const detailsRes = await control.get(`/api/callbacks/${callbackId}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.name).toBe('Order shipped v2');
    expect(detailsRes.data.conflict).toBeNull();

    capture.clear();
    await control.post(`/api/callbacks/${callbackId}/fire`, {});
    await capture.waitForRequests(1);
    expect(capture.requests[0].method).toBe('POST');
    expect(capture.requests[0].url).toBe('/v2/orders');

    expect((await control.delete('/api/callbacks/order-shipped')).status).toBe(
      404,
    );
    const deleteRes = await control.delete(`/api/callbacks/${callbackId}`);
    expect(deleteRes.status).toBe(204);
    expect((await control.get(`/api/callbacks/${callbackId}`)).status).toBe(
      404,
    );
    expect(
      (await control.post(`/api/callbacks/${callbackId}/fire`, {})).status,
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
    const fireUrl = `/api/callbacks/${createRes.data.id}/fire`;

    await control.post(fireUrl, {
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

    await control.post(fireUrl, { delay: 60_000 });
    const cancelTarget = (await control.get('/api/callbacks/pending')).data
      .pending[0];
    const cancelRes = await control.delete(
      `/api/callbacks/pending/${cancelTarget.id}`,
    );
    expect(cancelRes.status).toBe(204);

    await control.post(fireUrl, { delay: 60_000 });
    await control.post(fireUrl, { delay: 60_000 });
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

    const slugPatchRes = await control.patch(
      `/api/callbacks/${createRes.data.id}`,
      {
        slug: 'other',
      },
    );
    expect(slugPatchRes.status).toBe(400);
    expect(slugPatchRes.data.code).toBe('BAD_REQUEST');
  });

  it('lists a ui callback and a later file callback with the same slug and blocks firing the shadowed one', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const createRes = await control.post('/api/callbacks', {
      slug: 'Overlap',
      name: 'UI overlap',
      url: `${capture.url}/from-ui`,
    });
    expect(createRes.status).toBe(201);
    const uiId = createRes.data.id;

    const filePath = await subject.createMock(`
      callback "overlap" {
        url = "${capture.url}/from-file"
      }
    `);
    const normalizedFilePath = normalizeFilePath(subject, filePath);

    const listRes = await control.get('/api/callbacks');
    expect(listRes.status).toBe(200);
    const overlapping = listRes.data.filter(
      (callback: { slug: string }) => callback.slug.toLowerCase() === 'overlap',
    );
    expect(overlapping).toHaveLength(2);

    const uiCallback = overlapping.find(
      (callback: any) => callback.id === uiId,
    );
    const fileCallback = overlapping.find(
      (callback: any) => callback.id !== uiId,
    );
    expect(uiCallback.annotations).toEqual(['TEMPORARY']);
    expect(fileCallback.annotations).toEqual(['READ_ONLY', 'SHADOWED']);
    expect(fileCallback.filePath).toBe(normalizedFilePath);

    const uiDetails = await control.get(`/api/callbacks/${uiId}`);
    expect(uiDetails.status).toBe(200);
    expect(uiDetails.data.conflict).toEqual({
      role: 'active',
      related: [
        {
          id: fileCallback.id,
          slug: 'overlap',
          method: 'POST',
          filePath: normalizedFilePath,
          origin: 'FILE',
        },
      ],
    });

    const fileDetails = await control.get(`/api/callbacks/${fileCallback.id}`);
    expect(fileDetails.status).toBe(200);
    expect(fileDetails.data.url).toBe(`${capture.url}/from-file`);
    expect(fileDetails.data.annotations).toEqual(['READ_ONLY', 'SHADOWED']);
    expect(fileDetails.data.conflict).toEqual({
      role: 'shadowed',
      related: [
        {
          id: uiId,
          slug: 'Overlap',
          name: 'UI overlap',
          method: 'POST',
          origin: 'UI',
        },
      ],
    });

    const shadowedFireRes = await control.post(
      `/api/callbacks/${fileCallback.id}/fire`,
      {},
    );
    expect(shadowedFireRes.status).toBe(409);
    expect(shadowedFireRes.data.code).toBe('CALLBACK_SHADOWED');

    const fireRes = await control.post(`/api/callbacks/${uiId}/fire`, {});
    expect(fireRes.status).toBe(202);
    await capture.waitForRequests(1);
    expect(capture.requests[0].url).toBe('/from-ui');
  });

  it('flags two file callbacks with the same slug as conflicting and still fires them', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await subject.createMock(`
      callback "twin" {
        url = "${capture.url}/twin"
      }
    `);
    await subject.createMock(`
      callback "Twin" {
        url = "${capture.url}/twin"
      }
    `);

    const listRes = await control.get('/api/callbacks');
    expect(listRes.status).toBe(200);
    const twins = listRes.data.filter(
      (callback: { slug: string }) => callback.slug.toLowerCase() === 'twin',
    );
    expect(twins).toHaveLength(2);
    expect(new Set(twins.map((callback: any) => callback.id)).size).toBe(2);

    for (const twin of twins) {
      expect(twin.annotations).toEqual(['READ_ONLY', 'CONFLICT']);

      const detailsRes = await control.get(`/api/callbacks/${twin.id}`);
      expect(detailsRes.status).toBe(200);
      expect(detailsRes.data.conflict.role).toBe('conflict');
      expect(
        detailsRes.data.conflict.related.map((item: any) => item.id),
      ).toEqual(
        twins
          .filter((other: any) => other.id !== twin.id)
          .map((other: any) => other.id),
      );
    }

    const fireRes = await control.post(
      `/api/callbacks/${twins[0].id}/fire`,
      {},
    );
    expect(fireRes.status).toBe(202);
    await capture.waitForRequests(1);
    expect(capture.requests[0].url).toBe('/twin');
  });
});
