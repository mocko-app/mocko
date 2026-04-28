import {
  createRedisSubject,
  describeRedis,
  flushRedis,
  MockoInstance,
  randomPath,
  RedisTestConfig,
} from '../../harness';

describeRedis('cli redis wiring', () => {
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

  it('supports redis URL mode via -r / --redis', async () => {
    const route = randomPath();

    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
    }));

    const control = subject.ensureControl();
    const createRes = await control.post('/api/mocks', {
      name: 'cli url redis',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        body: 'url redis',
        headers: {},
      },
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.annotations).not.toContain('READ_ONLY');
    expect(createRes.data.annotations).not.toContain('TEMPORARY');
    expect((await subject.client.get(route)).data).toBe('url redis');
  });

  it('supports redis parameter mode from env without REDIS_URL', async () => {
    const route = randomPath();

    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'params',
    }));

    const control = subject.ensureControl();
    const createRes = await control.post('/api/mocks', {
      name: 'cli params redis',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        body: 'params redis',
        headers: {},
      },
    });

    expect(createRes.status).toBe(201);
    expect(createRes.data.annotations).not.toContain('READ_ONLY');
    expect(createRes.data.annotations).not.toContain('TEMPORARY');
    expect((await subject.client.get(route)).data).toBe('params redis');
  });
});
