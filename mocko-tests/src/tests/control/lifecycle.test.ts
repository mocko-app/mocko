import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createSubject, MockoInstance, randomPath } from '../../harness';

function normalizeMockFilePath(subject: MockoInstance, filePath: string) {
  return path.relative(subject.dir, filePath).replace(/\\/g, '/');
}

describe('control integration', () => {
  let subject: MockoInstance;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('runs the mock lifecycle through control and deploys to core', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const createRes = await control.post('/api/mocks', {
      name: 'first',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        delay: 200,
        body: 'hello',
        headers: {
          'X-Test': '1',
        },
      },
    });

    expect(createRes.status).toBe(201);
    const createdMock = createRes.data;
    expect(createdMock.annotations).toContain('TEMPORARY');
    expect(createdMock).not.toHaveProperty('filePath');

    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);
    const listedCreatedMock = listRes.data.find(
      (mock: any) => mock.id === createdMock.id,
    );
    expect(listedCreatedMock).toBeTruthy();
    expect(listedCreatedMock).not.toHaveProperty('filePath');

    const initialStart = Date.now();
    const initialProxyResponse = await subject.client.get(route);
    const initialElapsed = Date.now() - initialStart;
    expect(initialProxyResponse.status).toBe(200);
    expect(initialProxyResponse.data).toBe('hello');
    expect(initialProxyResponse.headers['x-test']).toBe('1');
    expect(initialElapsed).toBeGreaterThanOrEqual(180);
    expect(initialElapsed).toBeLessThan(500);

    const updateRes = await control.patch(`/api/mocks/${createdMock.id}`, {
      response: {
        code: 202,
        delay: 0,
        body: 'updated',
      },
    });

    expect(updateRes.status).toBe(200);
    const updatedStart = Date.now();
    const updatedProxyResponse = await subject.client.get(route);
    const updatedElapsed = Date.now() - updatedStart;
    expect(updatedProxyResponse.status).toBe(202);
    expect(updatedProxyResponse.data).toBe('updated');
    expect(updatedElapsed).toBeLessThan(100);

    const detailsRes = await control.get(`/api/mocks/${createdMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.response.code).toBe(202);
    expect(detailsRes.data.response.delay).toBe(0);
    expect(detailsRes.data.failure).toBeNull();
    expect(detailsRes.data).not.toHaveProperty('filePath');

    const disableRes = await control.patch(`/api/mocks/${createdMock.id}`, {
      isEnabled: false,
    });
    expect(disableRes.status).toBe(200);
    expect((await subject.client.get(route)).status).toBe(404);

    const enableRes = await control.patch(`/api/mocks/${createdMock.id}`, {
      isEnabled: true,
    });
    expect(enableRes.status).toBe(200);
    expect((await subject.client.get(route)).status).toBe(202);

    const deleteRes = await control.delete(`/api/mocks/${createdMock.id}`);
    expect(deleteRes.status).toBe(204);
    expect((await subject.client.get(route)).status).toBe(404);
    expect((await control.get(`/api/mocks/${createdMock.id}`)).status).toBe(
      404,
    );
  });

  it('clears delay when patching a mock without a delay field', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const createRes = await control.post('/api/mocks', {
      name: 'with delay',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        delay: 300,
        body: 'delayed',
        headers: {},
      },
    });
    expect(createRes.status).toBe(201);

    const initialDetailsRes = await control.get(
      `/api/mocks/${createRes.data.id}`,
    );
    expect(initialDetailsRes.data.response.delay).toBe(300);

    const patchRes = await control.patch(`/api/mocks/${createRes.data.id}`, {
      response: {
        code: 200,
        body: 'no delay',
        headers: {},
      },
    });
    expect(patchRes.status).toBe(200);

    const detailsRes = await control.get(`/api/mocks/${createRes.data.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.response.delay).toBeUndefined();

    const start = Date.now();
    const proxyRes = await subject.client.get(route);
    const elapsed = Date.now() - start;
    expect(proxyRes.status).toBe(200);
    expect(proxyRes.data).toBe('no delay');
    expect(elapsed).toBeLessThan(100);
  });

  it('merges file mocks as read-only and blocks mutations', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const filePath = await subject.createMock(`
      mock "GET ${route}" {
        delay = 200
        body = "from file"
      }
    `);
    const normalizedFilePath = normalizeMockFilePath(subject, filePath);

    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);

    const fileMock = listRes.data.find((mock: any) => mock.path === route);
    expect(fileMock).toBeTruthy();
    expect(fileMock.annotations).toContain('READ_ONLY');
    expect(fileMock.annotations).not.toContain('TEMPORARY');
    expect(fileMock.name).toBe(normalizedFilePath);
    expect(fileMock.filePath).toBe(normalizedFilePath);
    expect(fileMock.isEnabled).toBe(true);

    const detailsRes = await control.get(`/api/mocks/${fileMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.name).toBe(normalizedFilePath);
    expect(detailsRes.data.filePath).toBe(normalizedFilePath);
    expect(detailsRes.data.isEnabled).toBe(true);
    expect(detailsRes.data.response.code).toBe(200);
    expect(detailsRes.data.response.delay).toBe(200);
    expect(detailsRes.data.failure).toBeNull();

    const patchRes = await control.patch(`/api/mocks/${fileMock.id}`, {
      name: 'changed',
    });
    expect(patchRes.status).toBe(409);
    expect(patchRes.data.code).toBe('MOCK_READ_ONLY');

    const deleteRes = await control.delete(`/api/mocks/${fileMock.id}`);
    expect(deleteRes.status).toBe(204);
  });

  it('lists nested file mocks as read-only with path-based default names', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const route = randomPath();
    const nestedDir = path.join(subject.dir, 'a', 'b', 'c');

    await fs.mkdir(nestedDir, { recursive: true });
    const revision = await subject.getRevision();
    await fs.writeFile(
      path.join(nestedDir, 'deep.hcl'),
      `mock "GET ${route}" { body = "from nested file" }`,
    );
    await subject.waitForRemap(revision);

    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);

    const fileMock = listRes.data.find((mock: any) => mock.path === route);
    expect(fileMock).toBeTruthy();
    expect(fileMock.annotations).toContain('READ_ONLY');
    expect(fileMock.name).toBe('a/b/c/deep.hcl');
  });

  it('lists file mocks with hcl names', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const filePath = await subject.createMock(`
      mock "GET ${route}" {
        name = "Friendly name"
        body = "from named file"
      }
    `);
    const normalizedFilePath = normalizeMockFilePath(subject, filePath);

    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);

    const fileMock = listRes.data.find((mock: any) => mock.path === route);
    expect(fileMock).toBeTruthy();
    expect(fileMock.name).toBe('Friendly name');
    expect(fileMock.filePath).toBe(normalizedFilePath);

    const detailsRes = await control.get(`/api/mocks/${fileMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.name).toBe('Friendly name');
    expect(detailsRes.data.filePath).toBe(normalizedFilePath);
  });

  it('falls back to file path for empty hcl names', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const filePath = await subject.createMock(`
      mock "GET ${route}" {
        name = ""
        body = "from unnamed file"
      }
    `);
    const normalizedFilePath = normalizeMockFilePath(subject, filePath);

    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);

    const fileMock = listRes.data.find((mock: any) => mock.path === route);
    expect(fileMock).toBeTruthy();
    expect(fileMock.name).toBe(normalizedFilePath);
    expect(fileMock.filePath).toBe(normalizedFilePath);

    const detailsRes = await control.get(`/api/mocks/${fileMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.name).toBe(normalizedFilePath);
    expect(detailsRes.data.filePath).toBe(normalizedFilePath);
  });

  it('lists explicitly enabled file mocks and serves their routes', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await subject.createMock(`
      mock "GET ${route}" {
        enabled = true
        body = "enabled"
      }
    `);

    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);

    const fileMock = listRes.data.find((mock: any) => mock.path === route);
    expect(fileMock).toBeTruthy();
    expect(fileMock.isEnabled).toBe(true);

    const detailsRes = await control.get(`/api/mocks/${fileMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.isEnabled).toBe(true);

    const routeRes = await subject.client.get(route);
    expect(routeRes.status).toBe(200);
    expect(routeRes.data).toBe('enabled');
  });

  it('lists disabled file mocks without serving their routes', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await subject.createMock(`
      mock "GET ${route}" {
        enabled = false
        body = "disabled"
      }
    `);

    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);

    const fileMock = listRes.data.find((mock: any) => mock.path === route);
    expect(fileMock).toBeTruthy();
    expect(fileMock.isEnabled).toBe(false);

    const detailsRes = await control.get(`/api/mocks/${fileMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.isEnabled).toBe(false);

    const routeRes = await subject.client.get(route);
    expect(routeRes.status).toBe(404);
  });

  it('validates reserved control path on create', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const res = await control.post('/api/mocks', {
      name: 'invalid',
      method: 'GET',
      path: '/__mocko__/test',
      response: {
        code: 200,
      },
    });

    expect(res.status).toBe(400);
    expect(res.data.code).toBe('BAD_REQUEST');
  });

  it('validates response delay on create and patch', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const createRes = await control.post('/api/mocks', {
      name: 'invalid delay',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        delay: -1,
        headers: {},
      },
    });

    expect(createRes.status).toBe(400);
    expect(createRes.data.code).toBe('BAD_REQUEST');
    expect(
      createRes.data.errors.fieldErrors['response.delay'] ??
        createRes.data.errors.fieldErrors.response,
    ).toBeTruthy();

    const validCreateRes = await control.post('/api/mocks', {
      name: 'valid delay',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        headers: {},
      },
    });

    expect(validCreateRes.status).toBe(201);

    const fractionalPatchRes = await control.patch(
      `/api/mocks/${validCreateRes.data.id}`,
      {
        response: {
          code: 200,
          delay: 1.5,
          headers: {},
        },
      },
    );
    expect(fractionalPatchRes.status).toBe(400);
    expect(fractionalPatchRes.data.code).toBe('BAD_REQUEST');
    expect(
      fractionalPatchRes.data.errors.fieldErrors['response.delay'] ??
        fractionalPatchRes.data.errors.fieldErrors.response,
    ).toBeTruthy();

    const overLimitPatchRes = await control.patch(
      `/api/mocks/${validCreateRes.data.id}`,
      {
        response: {
          code: 200,
          delay: 300001,
          headers: {},
        },
      },
    );
    expect(overLimitPatchRes.status).toBe(400);
    expect(overLimitPatchRes.data.code).toBe('BAD_REQUEST');
    expect(
      overLimitPatchRes.data.errors.fieldErrors['response.delay'] ??
        overLimitPatchRes.data.errors.fieldErrors.response,
    ).toBeTruthy();
  });

  it('rejects save when response body has invalid bigodon template', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const res = await control.post('/api/mocks', {
      name: 'invalid template',
      method: 'GET',
      path: randomPath(),
      response: {
        code: 200,
        body: '{{#if value}}x{{/each}}',
        headers: {
          'Content-Type': 'text/plain',
        },
      },
    });

    expect(res.status).toBe(400);
    expect(res.data.code).toBe('TEMPLATE_PARSE_ERROR');
    expect(res.data.parsingError).toBeTruthy();
    expect(res.data.message).toContain('Error at line');
    expect(typeof res.data.parsingError.line).toBe('number');
    expect(typeof res.data.parsingError.column).toBe('number');
  });

  it('rejects patch when response body has invalid bigodon template', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const createRes = await control.post('/api/mocks', {
      name: 'to patch',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        body: 'ok',
        headers: {
          'Content-Type': 'text/plain',
        },
      },
    });

    expect(createRes.status).toBe(201);

    const patchRes = await control.patch(`/api/mocks/${createRes.data.id}`, {
      response: {
        code: 200,
        body: '{{#if value}}x{{/each}}',
        headers: {},
      },
    });

    expect(patchRes.status).toBe(400);
    expect(patchRes.data.code).toBe('TEMPLATE_PARSE_ERROR');
    expect(patchRes.data.parsingError).toBeTruthy();
    expect(patchRes.data.message).toContain('Error at line');
    expect(typeof patchRes.data.parsingError.line).toBe('number');
    expect(typeof patchRes.data.parsingError.column).toBe('number');
  });
});
