import {
  createContent,
  createRedisSubject,
  describeRedis,
  flushRedis,
  CONTENT_PORT,
  MockoInstance,
  RedisTestConfig,
} from '../../harness';

function findHost(list: any[], slug: string) {
  const host = list.find((item) => item.slug === slug);
  expect(host).toBeTruthy();
  return host;
}

describeRedis('redis hosts persistence', () => {
  let subject: MockoInstance | null = null;
  let content: MockoInstance | null = null;
  let redis: RedisTestConfig | null = null;

  beforeAll(async () => {
    content = await createContent();
  });

  afterAll(async () => {
    if (content) {
      await content.stop();
    }
  });

  afterEach(async () => {
    if (subject) {
      await subject.stop();
      subject = null;
    }
    if (redis) {
      await flushRedis(redis);
      redis = null;
    }
  });

  it('persists ui-created hosts across restart and merges file hosts in redis mode', async () => {
    await content!.createMock(`
      mock "GET /redis-host" {
        body = "proxied from redis host"
      }
    `);

    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
    }));

    const control = subject.ensureControl();
    let revision = await subject.getRevision();
    const createRes = await control.post('/api/hosts', {
      slug: 'redis-host',
      name: '',
      source: 'redis.local',
      destination: `http://localhost:${CONTENT_PORT}`,
    });
    expect(createRes.status).toBe(201);
    expect(createRes.data.name).toBe('');
    expect(createRes.data.annotations).not.toContain('READ_ONLY');
    expect(createRes.data.annotations).not.toContain('TEMPORARY');
    await subject.waitForRemap(revision);
    const proxyRes = await subject.client.get('/redis-host', {
      headers: { Host: 'redis.local' },
    });
    expect(proxyRes.status).toBe(200);
    expect(proxyRes.data).toBe('proxied from redis host');

    revision = await subject.getRevision();
    const updateRes = await control.patch('/api/hosts/redis-host', {
      source: 'redis-updated.local',
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.data.source).toBe('redis-updated.local');
    await subject.waitForRemap(revision);

    await subject.stop();
    subject = null;

    ({ subject } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
      redis,
    }));

    const restartedControl = subject.ensureControl();
    const detailsRes = await restartedControl.get('/api/hosts/redis-host');
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.name).toBe('');
    expect(detailsRes.data.source).toBe('redis-updated.local');
    expect(detailsRes.data.annotations).not.toContain('READ_ONLY');
    expect(detailsRes.data.annotations).not.toContain('TEMPORARY');
    const restartedProxyRes = await subject.client.get('/redis-host', {
      headers: { Host: 'redis-updated.local' },
    });
    expect(restartedProxyRes.status).toBe(200);
    expect(restartedProxyRes.data).toBe('proxied from redis host');

    await subject.createMock(`
      host "file-host" {
        name        = "File host"
        source      = "file.local"
        destination = "http://localhost:${CONTENT_PORT}"
      }
    `);

    const listRes = await restartedControl.get('/api/hosts');
    expect(listRes.status).toBe(200);
    expect(findHost(listRes.data, 'redis-host').annotations).not.toContain(
      'READ_ONLY',
    );
    expect(findHost(listRes.data, 'file-host').annotations).toContain(
      'READ_ONLY',
    );
    expect(findHost(listRes.data, 'file-host').name).toBe('File host');

    const deleteRes = await restartedControl.delete('/api/hosts/redis-host');
    expect(deleteRes.status).toBe(204);

    await subject.stop();
    subject = null;

    ({ subject } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
      redis,
    }));

    expect(
      (await subject.ensureControl().get('/api/hosts/redis-host')).status,
    ).toBe(404);
    const finalListRes = await subject.ensureControl().get('/api/hosts');
    expect(finalListRes.status).toBe(200);
    expect(findHost(finalListRes.data, 'file-host').annotations).toContain(
      'READ_ONLY',
    );
  });

  it('rejects duplicate slugs against file-defined hosts in redis mode', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
    }));

    await subject.createMock(`
      host "duplicate" {
        source      = "duplicate.local"
        destination = "http://localhost:${CONTENT_PORT}"
      }
    `);

    const createRes = await subject.ensureControl().post('/api/hosts', {
      slug: 'duplicate',
      source: 'other.local',
      destination: `http://localhost:${CONTENT_PORT}`,
    });
    expect(createRes.status).toBe(409);
    expect(createRes.data.code).toBe('HOST_SLUG_CONFLICT');
  });
});
