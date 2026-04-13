import {
  createRedisClient,
  createRedisSubject,
  describeRedis,
  flushRedis,
  getEffectiveRedisPrefix,
  MockoInstance,
  randomPath,
  RedisTestConfig,
} from '../../harness';

function findMock(list: any[], route: string) {
  const mock = list.find((item) => item.path === route);
  expect(mock).toBeTruthy();
  return mock;
}

describeRedis('redis mock failures', () => {
  let subject: MockoInstance | null = null;
  let redis: RedisTestConfig | null = null;

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

  it('returns failures when fetching a control-created mock', async () => {
    const route = randomPath();

    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
    }));

    const control = subject.ensureControl();
    const createRes = await control.post('/api/mocks', {
      name: 'failing mock',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        body: "{{getFlag 'foo::bar'}}",
        headers: {},
      },
    });
    expect(createRes.status).toBe(201);
    const createdMock = createRes.data;

    const proxyRes = await subject.client.get(route);
    expect(proxyRes.status).toBe(500);

    const detailsRes = await control.get(`/api/mocks/${createdMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.failure).toBeTruthy();
    expect(detailsRes.data.failure.message).toContain('Error');

    const redisClient = createRedisClient(redis);
    await redisClient.del(
      `${getEffectiveRedisPrefix(redis.prefix)}mock_failure:${createdMock.id}`,
    );
    redisClient.disconnect();

    const clearedDetailsRes = await control.get(`/api/mocks/${createdMock.id}`);
    expect(clearedDetailsRes.status).toBe(200);
    expect(clearedDetailsRes.data.failure).toBeNull();
  });

  it('returns failures when fetching a file-created mock in redis mode', async () => {
    const route = randomPath();

    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
    }));

    const control = subject.ensureControl();
    await subject.createMock(`
      mock "GET ${route}" {
        body = "{{getFlag 'foo::bar'}}"
      }
    `);

    const listRes = await control.get('/api/mocks');
    expect(listRes.status).toBe(200);
    const fileMock = findMock(listRes.data, route);

    const proxyRes = await subject.client.get(route);
    expect(proxyRes.status).toBe(500);

    const detailsRes = await control.get(`/api/mocks/${fileMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.failure).toBeTruthy();
    expect(detailsRes.data.failure.message).toContain('Error');
    expect(fileMock.annotations).toContain('READ_ONLY');
  });

  it('clears a control-created mock failure after editing and redeploying it', async () => {
    const route = randomPath();

    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
    }));

    const control = subject.ensureControl();
    const createRes = await control.post('/api/mocks', {
      name: 'failing mock',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        body: "{{getFlag 'foo::bar'}}",
        headers: {},
      },
    });
    expect(createRes.status).toBe(201);
    const createdMock = createRes.data;

    const proxyRes = await subject.client.get(route);
    expect(proxyRes.status).toBe(500);

    const detailsRes = await control.get(`/api/mocks/${createdMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.failure).toBeTruthy();

    const patchRes = await control.patch(`/api/mocks/${createdMock.id}`, {
      response: {
        body: 'ok',
      },
    });
    expect(patchRes.status).toBe(200);

    const clearedDetailsRes = await control.get(`/api/mocks/${createdMock.id}`);
    expect(clearedDetailsRes.status).toBe(200);
    expect(clearedDetailsRes.data.failure).toBeNull();

    const redisClient = createRedisClient(redis);
    const storedFailure = await redisClient.get(
      `${getEffectiveRedisPrefix(redis.prefix)}mock_failure:${createdMock.id}`,
    );
    expect(storedFailure).toBeNull();
    redisClient.disconnect();
  });
});
