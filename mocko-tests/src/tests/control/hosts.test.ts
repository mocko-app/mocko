import * as path from 'node:path';
import {
  createContent,
  createSubject,
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
        destination = "http://localhost:${content.port}/named"
      }
      host "empty-name" {
        name        = ""
        source      = "empty-name.local"
        destination = "http://localhost:${content.port}/empty-name"
      }
      host "unnamed" {
        source      = "unnamed.local"
        destination = "http://localhost:${content.port}/unnamed"
      }
    `);
    const normalizedFilePath = normalizeHostFilePath(subject, filePath);

    const listRes = await control.get('/api/hosts');
    expect(listRes.status).toBe(200);

    const namedHost = findHost(listRes.data, 'named');
    expect(namedHost.name).toBe('Friendly name');
    expect(namedHost.source).toBe('named.local');
    expect(namedHost.destination).toBe(
      `http://localhost:${content.port}/named`,
    );
    expect(namedHost.annotations).toContain('READ_ONLY');
    expect(namedHost.annotations).not.toContain('TEMPORARY');

    const emptyNameHost = findHost(listRes.data, 'empty-name');
    expect(emptyNameHost.name).toBe('');
    expect(emptyNameHost.annotations).toContain('READ_ONLY');

    const unnamedHost = findHost(listRes.data, 'unnamed');
    expect(unnamedHost.name).toBeUndefined();
    expect(unnamedHost.annotations).toContain('READ_ONLY');

    expect(namedHost.id).toEqual(expect.any(String));
    expect(namedHost.filePath).toBe(normalizedFilePath);
    expect(
      new Set(listRes.data.map((host: { id: string }) => host.id)).size,
    ).toBe(listRes.data.length);

    const detailsRes = await control.get(`/api/hosts/${namedHost.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.id).toBe(namedHost.id);
    expect(detailsRes.data.slug).toBe('named');
    expect(detailsRes.data.filePath).toBe(normalizedFilePath);
    expect(detailsRes.data.conflict).toBeNull();
    expect(detailsRes.data.name).toBe('Friendly name');
    expect(detailsRes.data.source).toBe('named.local');
    expect(detailsRes.data.destination).toBe(
      `http://localhost:${content.port}/named`,
    );
    expect(detailsRes.data.annotations).toEqual(['READ_ONLY']);

    const emptyNameDetailsRes = await control.get(
      `/api/hosts/${emptyNameHost.id}`,
    );
    expect(emptyNameDetailsRes.status).toBe(200);
    expect(emptyNameDetailsRes.data.name).toBe('');

    const unnamedDetailsRes = await control.get(`/api/hosts/${unnamedHost.id}`);
    expect(unnamedDetailsRes.status).toBe(200);
    expect(unnamedDetailsRes.data.name).toBeUndefined();

    expect((await control.get('/api/hosts/named')).status).toBe(404);
    expect(normalizedFilePath).toContain('.hcl');

    const patchRes = await control.patch(`/api/hosts/${namedHost.id}`, {
      name: 'Changed',
    });
    expect(patchRes.status).toBe(409);
    expect(patchRes.data.code).toBe('HOST_READ_ONLY');

    const deleteRes = await control.delete(`/api/hosts/${namedHost.id}`);
    expect(deleteRes.status).toBe(409);
    expect(deleteRes.data.code).toBe('HOST_READ_ONLY');
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
      destination: `http://localhost:${content.port}`,
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    const hostId = createRes.data.id;
    expect(createRes.data.slug).toBe('storeless');
    expect(createRes.data.name).toBe('Storeless host');
    expect(createRes.data.annotations).toContain('TEMPORARY');
    expect(createRes.data.annotations).not.toContain('READ_ONLY');

    const listRes = await control.get('/api/hosts');
    expect(listRes.status).toBe(200);
    const listedHost = findHost(listRes.data, 'storeless');
    expect(listedHost.id).toBe(hostId);
    expect(listedHost.annotations).toContain('TEMPORARY');

    const bySlugRes = await control.get('/api/hosts/storeless');
    expect(bySlugRes.status).toBe(404);
    expect(bySlugRes.data.code).toBe('HOST_NOT_FOUND');

    const proxiedRes = await subject.client.get('/storeless-host', {
      headers: { Host: 'storeless.local' },
    });
    expect(proxiedRes.status).toBe(200);
    expect(proxiedRes.data).toBe('proxied from control host');

    const updateRes = await control.patch(`/api/hosts/${hostId}`, {
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

    const detailsRes = await control.get(`/api/hosts/${hostId}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.id).toBe(hostId);
    expect(detailsRes.data.name).toBe('');
    expect(detailsRes.data.source).toBe('updated.local');
    expect(detailsRes.data.conflict).toBeNull();

    expect((await control.delete('/api/hosts/storeless')).status).toBe(404);
    const deleteRes = await control.delete(`/api/hosts/${hostId}`);
    expect(deleteRes.status).toBe(204);
    expect((await control.get(`/api/hosts/${hostId}`)).status).toBe(404);
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
      destination: `http://localhost:${content.port}`,
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

  it('merges file and ui hosts in storeless mode and rejects duplicate ui slugs', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await subject.createMock(`
      host "file-only" {
        source      = "file-only.local"
        destination = "http://localhost:${content.port}"
      }
    `);

    const createRes = await control.post('/api/hosts', {
      slug: 'ui-only',
      name: 'UI only',
      source: 'ui-only.local',
      destination: `http://localhost:${content.port}`,
    });
    expect(createRes.status).toBe(201);

    const casedUiDuplicateRes = await control.post('/api/hosts', {
      slug: 'UI-Only',
      source: 'ui-only-2.local',
    });
    expect(casedUiDuplicateRes.status).toBe(409);
    expect(casedUiDuplicateRes.data.code).toBe('HOST_SLUG_CONFLICT');

    const listRes = await control.get('/api/hosts');
    expect(listRes.status).toBe(200);

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
      destination: `http://localhost:${content.port}`,
    });
    expect(createRes.status).toBe(201);

    const hostId = createRes.data.id;
    const patchRes = await control.patch(`/api/hosts/${hostId}`, {
      slug: 'other',
    });
    expect(patchRes.status).toBe(400);
    expect(patchRes.data.code).toBe('BAD_REQUEST');

    const emptyPatchRes = await control.patch(`/api/hosts/${hostId}`, {});
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

    const detailsRes = await control.get(`/api/hosts/${createHostRes.data.id}`);
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
      destination: `http://localhost:${content.port}`,
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

    const updateHostRes = await control.patch(
      `/api/hosts/${createHostRes.data.id}`,
      {
        destination: null,
      },
    );
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
      '-u': `http://localhost:${content.port}`,
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

  it('lists a ui host and a later file host with the same slug as active and shadowed', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const createRes = await control.post('/api/hosts', {
      slug: 'Overlap',
      source: 'overlap-ui.local',
    });
    expect(createRes.status).toBe(201);
    const uiId = createRes.data.id;

    const filePath = await subject.createMock(`
      host "overlap" {
        source = "overlap-file.local"
      }
    `);
    const normalizedFilePath = normalizeHostFilePath(subject, filePath);

    const listRes = await control.get('/api/hosts');
    expect(listRes.status).toBe(200);
    const overlapping = listRes.data.filter(
      (host: { slug: string }) => host.slug.toLowerCase() === 'overlap',
    );
    expect(overlapping).toHaveLength(2);

    const uiHost = overlapping.find((host: any) => host.id === uiId);
    const fileHost = overlapping.find((host: any) => host.id !== uiId);
    expect(uiHost.annotations).toEqual(['TEMPORARY']);
    expect(fileHost.annotations).toEqual(['READ_ONLY', 'SHADOWED']);
    expect(fileHost.filePath).toBe(normalizedFilePath);

    const uiDetails = await control.get(`/api/hosts/${uiId}`);
    expect(uiDetails.status).toBe(200);
    expect(uiDetails.data.conflict).toEqual({
      role: 'active',
      related: [
        {
          id: fileHost.id,
          slug: 'overlap',
          source: 'overlap-file.local',
          filePath: normalizedFilePath,
          origin: 'FILE',
        },
      ],
    });

    const fileDetails = await control.get(`/api/hosts/${fileHost.id}`);
    expect(fileDetails.status).toBe(200);
    expect(fileDetails.data.source).toBe('overlap-file.local');
    expect(fileDetails.data.annotations).toEqual(['READ_ONLY', 'SHADOWED']);
    expect(fileDetails.data.conflict).toEqual({
      role: 'shadowed',
      related: [
        {
          id: uiId,
          slug: 'Overlap',
          source: 'overlap-ui.local',
          origin: 'UI',
        },
      ],
    });
  });

  it('flags two file hosts with the same slug as conflicting', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await subject.createMock(`
      host "twin" {
        source = "twin-one.local"
      }
    `);
    await subject.createMock(`
      host "Twin" {
        source = "twin-two.local"
      }
    `);

    const listRes = await control.get('/api/hosts');
    expect(listRes.status).toBe(200);
    const twins = listRes.data.filter(
      (host: { slug: string }) => host.slug.toLowerCase() === 'twin',
    );
    expect(twins).toHaveLength(2);
    expect(new Set(twins.map((host: any) => host.id)).size).toBe(2);

    for (const twin of twins) {
      expect(twin.annotations).toEqual(['READ_ONLY', 'CONFLICT']);

      const detailsRes = await control.get(`/api/hosts/${twin.id}`);
      expect(detailsRes.status).toBe(200);
      expect(detailsRes.data.source).toBe(twin.source);
      expect(detailsRes.data.conflict.role).toBe('conflict');
      expect(
        detailsRes.data.conflict.related.map((host: any) => host.id),
      ).toEqual(
        twins
          .filter((other: any) => other.id !== twin.id)
          .map((other: any) => other.id),
      );
    }
  });
});
