import {
  createRedisClient,
  createRedisSubject,
  describeRedis,
  flushRedis,
  getEffectiveRedisPrefix,
  MockoInstance,
  randomPath,
  redisFlagFields,
  RedisTestConfig,
  setControlFlag,
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

  it('persists flags across restart and exposes them to templating', async () => {
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

    const putRes = await setControlFlag(control, flagKey, 'active');
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
      pipeline.hset(
        `${effectivePrefix}flags:bulk:alpha:item-${index}`,
        redisFlagFields(index),
      );
      pipeline.hset(
        `${effectivePrefix}flags:bulk:beta:item-${index}`,
        redisFlagFields(index),
      );
    }

    await pipeline.exec();
    redisClient.disconnect();

    const res = await subject.ensureControl().get('/api/flags?prefix=bulk:');
    expect(res.status).toBe(200);
    expect(res.data.isTruncated).toBe(false);
    expect(res.data.count).toBe(20_100);
    expect(res.data.matchCount).toBe(20_100);
    expect(res.data.flagKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'PREFIX',
          name: 'alpha',
          count: 10050,
          matchCount: 10050,
        }),
        expect.objectContaining({
          type: 'PREFIX',
          name: 'beta',
          count: 10050,
          matchCount: 10050,
        }),
      ]),
    );
    expect(res.data.flagKeys).toHaveLength(2);
  });

  it('filters Redis-backed lists deeply and keeps total folder counts', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
      env: {
        FLAGS_LIST_LIMIT: '10',
      },
    }));

    const redisClient = createRedisClient(redis);
    const effectivePrefix = getEffectiveRedisPrefix(redis.prefix);
    await redisClient
      .pipeline()
      .hset(`${effectivePrefix}flags:users:1234:status`, redisFlagFields('ok'))
      .hset(
        `${effectivePrefix}flags:users:1234:meta:plan`,
        redisFlagFields('gold'),
      )
      .hset(
        `${effectivePrefix}flags:users:9999:status`,
        redisFlagFields('nope'),
      )
      .exec();
    redisClient.disconnect();

    const res = await subject
      .ensureControl()
      .get('/api/flags?prefix=users:&q=1234');
    expect(res.status).toBe(200);
    expect(res.data.count).toBe(3);
    expect(res.data.matchCount).toBe(2);
    expect(res.data.flagKeys).toEqual([
      expect.objectContaining({
        type: 'PREFIX',
        name: '1234',
        count: 2,
        matchCount: 2,
      }),
    ]);
  });

  it('counts Redis-backed root flags alongside prefixes when filtering', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
      env: {
        FLAGS_LIST_LIMIT: '10',
      },
    }));

    const redisClient = createRedisClient(redis);
    const effectivePrefix = getEffectiveRedisPrefix(redis.prefix);
    await redisClient
      .pipeline()
      .hset(`${effectivePrefix}flags:root-flag`, redisFlagFields('on'))
      .hset(`${effectivePrefix}flags:prefix:deep-flag`, redisFlagFields('on'))
      .hset(`${effectivePrefix}flags:prefix:ignored`, redisFlagFields('off'))
      .exec();
    redisClient.disconnect();

    const res = await subject.ensureControl().get('/api/flags?q=flag');
    expect(res.status).toBe(200);
    expect(res.data.count).toBe(3);
    expect(res.data.matchCount).toBe(2);
    expect(res.data.flagKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'FLAG', name: 'root-flag' }),
        expect.objectContaining({
          type: 'PREFIX',
          name: 'prefix',
          count: 2,
          matchCount: 1,
        }),
      ]),
    );
  });

  it('filters Redis-backed lists case-insensitively', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
      env: {
        FLAGS_LIST_LIMIT: '10',
      },
    }));

    const redisClient = createRedisClient(redis);
    const effectivePrefix = getEffectiveRedisPrefix(redis.prefix);
    await redisClient
      .pipeline()
      .hset(`${effectivePrefix}flags:users:AbC:status`, redisFlagFields('ok'))
      .hset(`${effectivePrefix}flags:users:xyz:status`, redisFlagFields('nope'))
      .exec();
    redisClient.disconnect();

    const res = await subject
      .ensureControl()
      .get('/api/flags?prefix=users:&q=abc');
    expect(res.status).toBe(200);
    expect(res.data.flagKeys).toEqual([
      expect.objectContaining({
        type: 'PREFIX',
        name: 'AbC',
        count: 1,
        matchCount: 1,
      }),
    ]);
  });

  it('keeps Redis descendants visible when the current prefix matches the query', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
      env: {
        FLAGS_LIST_LIMIT: '10',
      },
    }));

    const redisClient = createRedisClient(redis);
    const effectivePrefix = getEffectiveRedisPrefix(redis.prefix);
    await redisClient
      .pipeline()
      .hset(`${effectivePrefix}flags:users:1214:device`, redisFlagFields('ios'))
      .hset(
        `${effectivePrefix}flags:users:1214:profile:phone`,
        redisFlagFields('555-1214'),
      )
      .exec();
    redisClient.disconnect();

    const res = await subject
      .ensureControl()
      .get('/api/flags?prefix=users:1214:&q=1214');
    expect(res.status).toBe(200);
    expect(res.data.flagKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'FLAG', name: 'device' }),
        expect.objectContaining({
          type: 'PREFIX',
          name: 'profile',
          count: 1,
          matchCount: 1,
        }),
      ]),
    );
  });
});
