import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createSubject, MockoInstance, randomPath } from '../../harness';

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
        body: 'hello',
        headers: {
          'X-Test': '1',
        },
      },
    });

    expect(createRes.status).toBe(201);
    const createdMock = createRes.data;
    expect(createdMock.annotations).toContain('TEMPORARY');

    const initialProxyResponse = await subject.client.get(route);
    expect(initialProxyResponse.status).toBe(200);
    expect(initialProxyResponse.data).toBe('hello');
    expect(initialProxyResponse.headers['x-test']).toBe('1');

    const updateRes = await control.patch(`/api/mocks/${createdMock.id}`, {
      response: {
        code: 202,
        body: 'updated',
      },
    });

    expect(updateRes.status).toBe(200);
    const updatedProxyResponse = await subject.client.get(route);
    expect(updatedProxyResponse.status).toBe(202);
    expect(updatedProxyResponse.data).toBe('updated');

    const detailsRes = await control.get(`/api/mocks/${createdMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.response.code).toBe(202);
    expect(detailsRes.data.failure).toBeNull();

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

  it('merges file mocks as read-only and blocks mutations', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await subject.createMock(`
      mock "GET ${route}" {
        body = "from file"
      }
    `);

    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);

    const fileMock = listRes.data.find((mock: any) => mock.path === route);
    expect(fileMock).toBeTruthy();
    expect(fileMock.annotations).toContain('READ_ONLY');
    expect(fileMock.annotations).not.toContain('TEMPORARY');

    const detailsRes = await control.get(`/api/mocks/${fileMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.response.code).toBe(200);
    expect(detailsRes.data.failure).toBeNull();

    const patchRes = await control.patch(`/api/mocks/${fileMock.id}`, {
      name: 'changed',
    });
    expect(patchRes.status).toBe(404);
    expect(patchRes.data.code).toBe('MOCK_NOT_FOUND');

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
        body: '{{#if value}}x{{/each}}',
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
