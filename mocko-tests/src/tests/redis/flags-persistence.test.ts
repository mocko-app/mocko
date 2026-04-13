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

jest.setTimeout(30000);

describeRedis('redis flags persistence', () => {
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

  it.skip('persists flags across restart and exposes them to templating', async () => {
    const route = randomPath();
    const flagKey = 'users:redis:status';

    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
    }));

    const control = subject.ensureControl();
    const createMockRes = await control.post('/api/mocks', {
      name: 'flag reader',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        body: `{{getFlag '${flagKey}'}}`,
        headers: {},
      },
    });
    expect(createMockRes.status).toBe(201);

    const putRes = await control.put(
      `/api/flags/${encodeURIComponent(flagKey)}`,
      {
        value: '"active"',
      },
    );
    expect(putRes.status).toBe(200);
    expect((await subject.client.get(route)).data).toBe('active');

    await subject.stop();
    subject = null;

    ({ subject } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
      redis,
    }));

    const restartedControl = subject.ensureControl();
    const getRes = await restartedControl.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(getRes.status).toBe(200);
    expect(getRes.data.value).toBe('"active"');
    expect((await subject.client.get(route)).data).toBe('active');

    const deleteRes = await restartedControl.delete(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(deleteRes.status).toBe(204);

    await subject.stop();
    subject = null;

    ({ subject } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
      redis,
    }));

    expect(
      (
        await subject
          .ensureControl()
          .get(`/api/flags/${encodeURIComponent(flagKey)}`)
      ).status,
    ).toBe(404);
  });

  it('lists grouped flags correctly when raw key count spans multiple scan pages', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
      env: {
        FLAGS_LIST_LIMIT: '10',
      },
    }));

    const redisClient = createRedisClient(redis);
    const effectivePrefix = getEffectiveRedisPrefix(redis.prefix);
    const pipeline = redisClient.pipeline();

    for (let index = 0; index < 10_050; index += 1) {
      pipeline.set(
        `${effectivePrefix}flags:bulk:alpha:item-${index}`,
        JSON.stringify(index),
      );
      pipeline.set(
        `${effectivePrefix}flags:bulk:beta:item-${index}`,
        JSON.stringify(index),
      );
    }

    await pipeline.exec();
    redisClient.disconnect();

    const res = await subject.ensureControl().get('/api/flags?prefix=bulk:');
    expect(res.status).toBe(200);
    expect(res.data.isTruncated).toBe(false);
    expect(res.data.flagKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'PREFIX', name: 'alpha' }),
        expect.objectContaining({ type: 'PREFIX', name: 'beta' }),
      ]),
    );
    expect(res.data.flagKeys).toHaveLength(2);
  });
});
