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

  it('surfaces redis-backed failure info and clears when the key is removed', async () => {
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
});
