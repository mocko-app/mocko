import * as path from 'node:path';
import {
  createContent,
  createSubject,
  CONTENT_PORT,
  MockoInstance,
  randomPath,
} from '../../harness';

function normalizeHostFilePath(subject: MockoInstance, filePath: string) {
  return path.relative(subject.dir, filePath).replace(/\\/g, '/');
}

function findHost(list: any[], slug: string) {
  const host = list.find((item) => item.slug === slug);
  expect(host).toBeTruthy();
  return host;
}

describe('control hosts integration', () => {
  let subject: MockoInstance;
  let content: MockoInstance;

  beforeAll(async () => {
    content = await createContent();
  });

  afterAll(async () => {
    await content.stop();
  });

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('lists file-defined hosts as read-only and returns their details in storeless mode', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const filePath = await subject.createMock(`
      host "named" {
        name        = "Friendly name"
        source      = "named.local"
        destination = "http://localhost:${CONTENT_PORT}/named"
      }
      host "empty-name" {
        name        = ""
        source      = "empty-name.local"
        destination = "http://localhost:${CONTENT_PORT}/empty-name"
      }
      host "unnamed" {
        source      = "unnamed.local"
        destination = "http://localhost:${CONTENT_PORT}/unnamed"
      }
    `);
    const normalizedFilePath = normalizeHostFilePath(subject, filePath);

    const listRes = await control.get('/api/hosts');
    expect(listRes.status).toBe(200);

    const namedHost = findHost(listRes.data, 'named');
    expect(namedHost.name).toBe('Friendly name');
    expect(namedHost.source).toBe('named.local');
    expect(namedHost.destination).toBe(
      `http://localhost:${CONTENT_PORT}/named`,
    );
    expect(namedHost.annotations).toContain('READ_ONLY');
    expect(namedHost.annotations).not.toContain('TEMPORARY');

    const emptyNameHost = findHost(listRes.data, 'empty-name');
    expect(emptyNameHost.name).toBe('');
    expect(emptyNameHost.annotations).toContain('READ_ONLY');

    const unnamedHost = findHost(listRes.data, 'unnamed');
    expect(unnamedHost.name).toBeUndefined();
    expect(unnamedHost.annotations).toContain('READ_ONLY');

    const detailsRes = await control.get('/api/hosts/named');
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.slug).toBe('named');
    expect(detailsRes.data.name).toBe('Friendly name');
    expect(detailsRes.data.source).toBe('named.local');
    expect(detailsRes.data.destination).toBe(
      `http://localhost:${CONTENT_PORT}/named`,
    );
    expect(detailsRes.data.annotations).toEqual(['READ_ONLY']);

    const emptyNameDetailsRes = await control.get('/api/hosts/empty-name');
    expect(emptyNameDetailsRes.status).toBe(200);
    expect(emptyNameDetailsRes.data.name).toBe('');

    const unnamedDetailsRes = await control.get('/api/hosts/unnamed');
    expect(unnamedDetailsRes.status).toBe(200);
    expect(unnamedDetailsRes.data.name).toBeUndefined();

    expect(normalizedFilePath).toContain('.hcl');
  });

  it('creates, updates, lists, and deletes ui hosts in storeless mode', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await content.createMock(`
      mock "GET /storeless-host" {
        body = "proxied from control host"
      }
    `);

    const createRes = await control.post('/api/hosts', {
      slug: 'storeless',
      name: 'Storeless host',
      source: 'storeless.local',
      destination: `http://localhost:${CONTENT_PORT}`,
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.slug).toBe('storeless');
    expect(createRes.data.name).toBe('Storeless host');
    expect(createRes.data.annotations).toContain('TEMPORARY');
    expect(createRes.data.annotations).not.toContain('READ_ONLY');

    const listRes = await control.get('/api/hosts');
    expect(listRes.status).toBe(200);
    const listedHost = findHost(listRes.data, 'storeless');
    expect(listedHost.annotations).toContain('TEMPORARY');

    const proxiedRes = await subject.client.get('/storeless-host', {
      headers: { Host: 'storeless.local' },
    });
    expect(proxiedRes.status).toBe(200);
    expect(proxiedRes.data).toBe('proxied from control host');

    const updateRes = await control.patch('/api/hosts/storeless', {
      name: '',
      source: 'updated.local',
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.data.name).toBe('');
    expect(updateRes.data.source).toBe('updated.local');
    expect(updateRes.data.annotations).toContain('TEMPORARY');

    expect(
      (
        await subject.client.get('/storeless-host', {
          headers: { Host: 'storeless.local' },
        })
      ).status,
    ).toBe(404);

    const updatedProxyRes = await subject.client.get('/storeless-host', {
      headers: { Host: 'updated.local' },
    });
    expect(updatedProxyRes.status).toBe(200);
    expect(updatedProxyRes.data).toBe('proxied from control host');

    const detailsRes = await control.get('/api/hosts/storeless');
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.name).toBe('');
    expect(detailsRes.data.source).toBe('updated.local');

    const deleteRes = await control.delete('/api/hosts/storeless');
    expect(deleteRes.status).toBe(204);
    expect((await control.get('/api/hosts/storeless')).status).toBe(404);
    expect(
      (
        await subject.client.get('/storeless-host', {
          headers: { Host: 'updated.local' },
        })
      ).status,
    ).toBe(404);
  });

  it('updates a control-created host-scoped mock back to no host in storeless mode', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const createHostRes = await control.post('/api/hosts', {
      slug: 'storeless',
      source: 'storeless.local',
      destination: `http://localhost:${CONTENT_PORT}`,
    });
    expect(createHostRes.status).toBe(201);

    const createMockRes = await control.post('/api/mocks', {
      name: 'storeless scoped mock',
      method: 'GET',
      path: route,
      host: 'storeless',
      response: {
        code: 200,
        body: 'storeless scoped response',
        headers: {},
      },
    });
    expect(createMockRes.status).toBe(201);

    expect((await subject.client.get(route)).status).toBe(404);

    const hostedRes = await subject.client.get(route, {
      headers: { Host: 'storeless.local' },
    });
    expect(hostedRes.status).toBe(200);
    expect(hostedRes.data).toBe('storeless scoped response');

    const updateRes = await control.patch(
      `/api/mocks/${createMockRes.data.id}`,
      {
        host: null,
      },
    );
    expect(updateRes.status).toBe(200);

    const withoutHostRes = await subject.client.get(route);
    expect(withoutHostRes.status).toBe(200);
    expect(withoutHostRes.data).toBe('storeless scoped response');

    const withHostRes = await subject.client.get(route, {
      headers: { Host: 'storeless.local' },
    });
    expect(withHostRes.status).toBe(200);
    expect(withHostRes.data).toBe('storeless scoped response');
  });

  it('merges file and ui hosts in storeless mode and rejects duplicate slugs', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await subject.createMock(`
      host "shared" {
        source      = "shared.local"
        destination = "http://localhost:${CONTENT_PORT}"
      }
      host "file-only" {
        source      = "file-only.local"
        destination = "http://localhost:${CONTENT_PORT}"
      }
    `);

    const duplicateRes = await control.post('/api/hosts', {
      slug: 'shared',
      source: 'other.local',
      destination: `http://localhost:${CONTENT_PORT}`,
    });
    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.data.code).toBe('HOST_SLUG_CONFLICT');

    const createRes = await control.post('/api/hosts', {
      slug: 'ui-only',
      name: 'UI only',
      source: 'ui-only.local',
      destination: `http://localhost:${CONTENT_PORT}`,
    });
    expect(createRes.status).toBe(201);

    const listRes = await control.get('/api/hosts');
    expect(listRes.status).toBe(200);

    expect(findHost(listRes.data, 'shared').annotations).toContain('READ_ONLY');
    expect(findHost(listRes.data, 'file-only').annotations).toContain(
      'READ_ONLY',
    );
    expect(findHost(listRes.data, 'ui-only').annotations).toContain(
      'TEMPORARY',
    );
  });

  it('returns validation and not-found errors for host management routes', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    expect((await control.get('/api/hosts/missing')).status).toBe(404);
    expect((await control.delete('/api/hosts/missing')).status).toBe(404);

    const createRes = await control.post('/api/hosts', {
      slug: 'validate',
      source: 'validate.local',
      destination: `http://localhost:${CONTENT_PORT}`,
    });
    expect(createRes.status).toBe(201);

    const patchRes = await control.patch('/api/hosts/validate', {
      slug: 'other',
    });
    expect(patchRes.status).toBe(400);
    expect(patchRes.data.code).toBe('BAD_REQUEST');

    const emptyPatchRes = await control.patch('/api/hosts/validate', {});
    expect(emptyPatchRes.status).toBe(400);
    expect(emptyPatchRes.data.code).toBe('BAD_REQUEST');
  });

  it('creates a ui host without destination and uses it only for host-scoped mocks', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const createHostRes = await control.post('/api/hosts', {
      slug: 'header-only',
      name: 'Header only',
      source: 'header-only.local',
    });
    expect(createHostRes.status).toBe(201);
    expect(createHostRes.data.destination).toBeUndefined();

    const listRes = await control.get('/api/hosts');
    expect(listRes.status).toBe(200);
    expect(findHost(listRes.data, 'header-only').destination).toBeUndefined();

    const detailsRes = await control.get('/api/hosts/header-only');
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.destination).toBeUndefined();

    const createMockRes = await control.post('/api/mocks', {
      name: 'header only scoped mock',
      method: 'GET',
      path: route,
      host: 'header-only',
      response: {
        code: 200,
        body: 'header only mock',
        headers: {},
      },
    });
    expect(createMockRes.status).toBe(201);

    const matchingRes = await subject.client.get(route, {
      headers: { Host: 'header-only.local' },
    });
    expect(matchingRes.status).toBe(200);
    expect(matchingRes.data).toBe('header only mock');

    expect((await subject.client.get(route)).status).toBe(404);

    const unmatchedRes = await subject.client.get('/header-only-unmatched', {
      headers: { Host: 'header-only.local' },
    });
    expect(unmatchedRes.status).toBe(404);
  });

  it('clears a ui host destination and keeps the host usable for host-header-only mocks', async () => {
    const route = randomPath();
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await content.createMock(`
      mock "GET /destination-cleared-upstream" {
        body = "proxied before clear"
      }
    `);

    const createHostRes = await control.post('/api/hosts', {
      slug: 'cleardest',
      source: 'clear-destination.local',
      destination: `http://localhost:${CONTENT_PORT}`,
    });
    expect(createHostRes.status).toBe(201);

    const proxiedBeforeClear = await subject.client.get(
      '/destination-cleared-upstream',
      {
        headers: { Host: 'clear-destination.local' },
      },
    );
    expect(proxiedBeforeClear.status).toBe(200);
    expect(proxiedBeforeClear.data).toBe('proxied before clear');

    const updateHostRes = await control.patch('/api/hosts/cleardest', {
      destination: null,
    });
    expect(updateHostRes.status).toBe(200);
    expect(updateHostRes.data.destination).toBeUndefined();

    const unmatchedAfterClear = await subject.client.get(
      '/destination-cleared-upstream',
      {
        headers: { Host: 'clear-destination.local' },
      },
    );
    expect(unmatchedAfterClear.status).toBe(404);

    const createMockRes = await control.post('/api/mocks', {
      name: 'cleared destination scoped mock',
      method: 'GET',
      path: route,
      host: 'cleardest',
      response: {
        code: 200,
        body: 'still scoped',
        headers: {},
      },
    });
    expect(createMockRes.status).toBe(201);

    const scopedRes = await subject.client.get(route, {
      headers: { Host: 'clear-destination.local' },
    });
    expect(scopedRes.status).toBe(200);
    expect(scopedRes.data).toBe('still scoped');
  });

  it('proxies unmatched requests for ui hosts without destination to the global proxy url when configured', async () => {
    subject = await createSubject({
      '--ui': true,
      '-u': `http://localhost:${CONTENT_PORT}`,
    });
    const control = subject.ensureControl();

    await content.createMock(`
      mock "GET /ui-header-only-upstream" {
        body = "from global proxy"
      }
    `);

    const createHostRes = await control.post('/api/hosts', {
      slug: 'uiglobal',
      source: 'ui-header-only-upstream.local',
    });
    expect(createHostRes.status).toBe(201);
    expect(createHostRes.data.destination).toBeUndefined();

    const proxiedRes = await subject.client.get('/ui-header-only-upstream', {
      headers: { Host: 'ui-header-only-upstream.local' },
    });
    expect(proxiedRes.status).toBe(200);
    expect(proxiedRes.data).toBe('from global proxy');
  });
});
