import Redis from 'ioredis';
import {
  createRedisClient,
  createRedisSubject,
  describeRedis,
  flagPayload,
  flushRedis,
  getEffectiveRedisPrefix,
  MockoInstance,
  RedisTestConfig,
} from '../../harness';

jest.setTimeout(45000);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type V1Mock = {
  id: string;
  name: string;
  method: string;
  path: string;
  response: { code: number; body: string; headers: Record<string, string> };
  isEnabled?: boolean;
};

describeRedis('v1 migration operations', () => {
  let subject: MockoInstance | null = null;
  let redis: RedisTestConfig | null = null;
  let redisClient: Redis.Redis | null = null;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
      subject = null;
    }
    if (redisClient) {
      redisClient.disconnect();
      redisClient = null;
    }
    if (redis) {
      await flushRedis(redis);
      redis = null;
    }
  });

  it('rejects migration and purge operations when the feature is disabled', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true, '--watch': false },
      mode: 'url',
    }));
    const control = subject.ensureControl();

    const listRes = await control.get('/api/operations');
    expect(listRes.status).toBe(200);
    expect(listRes.data.v1Migration).toBeUndefined();

    const migrationRes = await control.post('/api/operations', {
      type: 'V1_MIGRATION',
      v1MigrationData: { sourcePrefix: 'mocko:' },
    });
    expect(migrationRes.status).toBe(422);

    const purgeRes = await control.post('/api/operations', {
      type: 'V1_PURGE',
    });
    expect(purgeRes.status).toBe(422);
  });

  it('scans v1 data under the source prefix and finds nothing under a wrong one', async () => {
    ({ subject, redis } = await createV1MigrationSubject());
    redisClient = createRedisClient(redis);
    const control = subject.ensureControl();

    await seedV1Mock(redisClient, redis.prefix, aV1Mock({ path: '/scan-a' }));
    await seedV1Mock(redisClient, redis.prefix, aV1Mock({ path: '/scan-b' }));
    await seedV1Flag(redisClient, redis.prefix, 'scan:a', 'a');
    await seedV1Flag(redisClient, redis.prefix, 'scan:b', 'b');
    await seedV1Flag(redisClient, redis.prefix, 'scan:c', 'c');

    const listRes = await control.get('/api/operations');
    expect(listRes.data.v1Migration).toEqual({
      defaultSourcePrefix: redis.prefix,
    });

    const createRes = await control.post('/api/operations', {
      type: 'V1_MIGRATION',
      v1MigrationData: { sourcePrefix: redis.prefix },
    });
    expect(createRes.status).toBe(201);
    expect(createRes.data.status).toBe('SCANNING');

    const readyOperation = await waitForOperation(
      subject,
      createRes.data.id,
      'READY',
    );
    expect(readyOperation.v1MigrationData.mocksFound).toBe(2);
    expect(readyOperation.v1MigrationData.flagsFound).toBe(3);

    const wrongRes = await control.post('/api/operations', {
      type: 'V1_MIGRATION',
      v1MigrationData: { sourcePrefix: `wrong-${redis.prefix}` },
    });
    const wrongReady = await waitForOperation(
      subject,
      wrongRes.data.id,
      'READY',
    );
    expect(wrongReady.v1MigrationData.mocksFound).toBe(0);
    expect(wrongReady.v1MigrationData.flagsFound).toBe(0);
  });

  it('refuses to migrate into a workspace that already has mocks', async () => {
    ({ subject, redis } = await createV1MigrationSubject());
    redisClient = createRedisClient(redis);
    const control = subject.ensureControl();

    await seedV1Mock(redisClient, redis.prefix, aV1Mock({ path: '/guarded' }));

    const existingRes = await control.post('/api/mocks', {
      name: 'pre-existing',
      method: 'GET',
      path: '/pre-existing',
      response: { code: 200, body: 'existing', headers: {} },
    });
    expect(existingRes.status).toBe(201);

    const createRes = await control.post('/api/operations', {
      type: 'V1_MIGRATION',
      v1MigrationData: { sourcePrefix: redis.prefix },
    });
    await waitForOperation(subject, createRes.data.id, 'READY');

    const refusedRes = await control.patch(
      `/api/operations/${createRes.data.id}`,
      { status: 'EXECUTING' },
    );
    expect(refusedRes.status).toBe(400);

    const deleteRes = await control.delete(`/api/mocks/${existingRes.data.id}`);
    expect(deleteRes.status).toBe(204);

    const executeRes = await control.patch(
      `/api/operations/${createRes.data.id}`,
      { status: 'EXECUTING' },
    );
    expect(executeRes.status).toBe(200);
    await waitForOperation(subject, createRes.data.id, 'DONE');
  });

  it('migrates mocks and flags with backfilled fields, TTLs, and immediate deploy', async () => {
    ({ subject, redis } = await createV1MigrationSubject());
    redisClient = createRedisClient(redis);
    const control = subject.ensureControl();
    const v2Prefix = getEffectiveRedisPrefix(redis.prefix);

    const enabledMock = aV1Mock({
      path: '/migrated',
      response: {
        code: 201,
        body: 'hello from v1',
        headers: { 'X-Origin': 'v1' },
      },
    });
    const disabledMock = aV1Mock({ path: '/disabled', isEnabled: false });
    await seedV1Mock(redisClient, redis.prefix, enabledMock);
    await seedV1Mock(redisClient, redis.prefix, disabledMock);

    await seedV1Flag(redisClient, redis.prefix, 'plain', { deep: [1, 2] });
    await seedV1Flag(redisClient, redis.prefix, 'with-ttl', 'expiring', 60000);
    await seedV1Flag(redisClient, redis.prefix, 'colliding', 'v1-wins');
    const preexistingRes = await subject
      .ensureControl()
      .put(
        `/api/flags/${encodeURIComponent('colliding')}`,
        flagPayload('v2-value'),
      );
    expect(preexistingRes.status).toBe(200);

    const createRes = await control.post('/api/operations', {
      type: 'V1_MIGRATION',
      v1MigrationData: { sourcePrefix: redis.prefix },
    });
    await waitForOperation(subject, createRes.data.id, 'READY');
    await control.patch(`/api/operations/${createRes.data.id}`, {
      status: 'EXECUTING',
    });
    const doneOperation = await waitForOperation(
      subject,
      createRes.data.id,
      'DONE',
    );
    expect(doneOperation.v1MigrationData.mocksMigrated).toBe(2);
    expect(doneOperation.v1MigrationData.flagsMigrated).toBe(3);
    expect(doneOperation.v1MigrationData.flagsSkipped).toBe(0);

    const mocksRes = await control.get('/api/mocks');
    expect(mocksRes.status).toBe(200);
    expect(mocksRes.data).toHaveLength(2);
    const migrated = mocksRes.data.find(
      (mock: any) => mock.id === enabledMock.id,
    );
    expect(migrated).toMatchObject({
      name: enabledMock.name,
      method: 'GET',
      path: '/migrated',
      isEnabled: true,
      labels: [],
      annotations: [],
    });
    expect(migrated.host).toBeUndefined();
    expect(migrated.format).toBeUndefined();
    const detailsRes = await control.get(`/api/mocks/${enabledMock.id}`);
    expect(detailsRes.data.response).toMatchObject({
      code: 201,
      body: 'hello from v1',
      headers: { 'X-Origin': 'v1' },
    });
    expect(detailsRes.data.response.delay).toBeUndefined();

    const disabled = mocksRes.data.find(
      (mock: any) => mock.id === disabledMock.id,
    );
    expect(disabled.isEnabled).toBe(false);

    const servedRes = await subject.client.get('/migrated');
    expect(servedRes.status).toBe(201);
    expect(servedRes.data).toBe('hello from v1');
    expect(servedRes.headers['x-origin']).toBe('v1');
    expect((await subject.client.get('/disabled')).status).toBe(404);

    const plainRes = await getFlag(subject, 'plain');
    expect(plainRes.status).toBe(200);
    expect(plainRes.data.value).toBe(JSON.stringify({ deep: [1, 2] }));
    expect(plainRes.data.mockUpdatedAt).toBeDefined();
    expect(plainRes.data.controlUpdatedAt).toBeUndefined();

    expect(await redisClient.pttl(`${v2Prefix}flags:plain`)).toBe(-1);
    const remainingTtl = await redisClient.pttl(`${v2Prefix}flags:with-ttl`);
    expect(remainingTtl).toBeGreaterThan(0);
    expect(remainingTtl).toBeLessThanOrEqual(60000);

    const collidingRes = await getFlag(subject, 'colliding');
    expect(collidingRes.data.value).toBe(JSON.stringify('v1-wins'));
  });

  it('keeps mocks with invalid templates and clears the annotation on a successful update', async () => {
    ({ subject, redis } = await createV1MigrationSubject());
    redisClient = createRedisClient(redis);
    const control = subject.ensureControl();

    const brokenMock = aV1Mock({
      path: '/broken',
      response: { code: 200, body: 'broken {{#if}', headers: {} },
    });
    await seedV1Mock(redisClient, redis.prefix, brokenMock);

    await runMigration(subject, redis.prefix);

    const detailsRes = await control.get(`/api/mocks/${brokenMock.id}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.data.annotations).toContain('INVALID_TEMPLATE');

    expect((await subject.client.get('/broken')).status).toBe(500);

    const updateRes = await control.patch(`/api/mocks/${brokenMock.id}`, {
      response: { code: 200, body: 'fixed', headers: {} },
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.data.annotations).not.toContain('INVALID_TEMPLATE');

    const fixedRes = await subject.client.get('/broken');
    expect(fixedRes.status).toBe(200);
    expect(fixedRes.data).toBe('fixed');
  });

  it('re-runs cleanly, overwriting flags idempotently', async () => {
    ({ subject, redis } = await createV1MigrationSubject());
    redisClient = createRedisClient(redis);
    const control = subject.ensureControl();

    const mock = aV1Mock({ path: '/rerun' });
    await seedV1Mock(redisClient, redis.prefix, mock);
    await seedV1Flag(redisClient, redis.prefix, 'rerun', 'first');

    await runMigration(subject, redis.prefix);
    expect((await getFlag(subject, 'rerun')).data.value).toBe(
      JSON.stringify('first'),
    );

    const deleteRes = await control.delete(`/api/mocks/${mock.id}`);
    expect(deleteRes.status).toBe(204);
    await seedV1Flag(redisClient, redis.prefix, 'rerun', 'second');

    const rerunOperation = await runMigration(subject, redis.prefix);
    expect(rerunOperation.v1MigrationData.mocksMigrated).toBe(1);
    expect(rerunOperation.v1MigrationData.flagsMigrated).toBe(1);
    expect((await getFlag(subject, 'rerun')).data.value).toBe(
      JSON.stringify('second'),
    );
    expect((await subject.client.get('/rerun')).status).toBe(200);
  });

  it('purges only the known v1 keys and only after a completed migration', async () => {
    ({ subject, redis } = await createV1MigrationSubject());
    redisClient = createRedisClient(redis);
    const control = subject.ensureControl();
    const v2Prefix = getEffectiveRedisPrefix(redis.prefix);

    const prematureRes = await control.post('/api/operations', {
      type: 'V1_PURGE',
    });
    expect(prematureRes.status).toBe(400);

    const mock = aV1Mock({ path: '/purged' });
    await seedV1Mock(redisClient, redis.prefix, mock);
    await seedV1Flag(redisClient, redis.prefix, 'purge:a', 'a');
    await redisClient.set(
      `${redis.prefix}mocks_deployment`,
      JSON.stringify({ mocks: [] }),
    );
    await redisClient.set(`${redis.prefix}mock_failure:${mock.id}`, '{}');
    await redisClient.set(`${redis.prefix}unrelated-service-key`, 'keep-me');

    await runMigration(subject, redis.prefix);

    const createRes = await control.post('/api/operations', {
      type: 'V1_PURGE',
    });
    expect(createRes.status).toBe(201);
    const readyOperation = await waitForOperation(
      subject,
      createRes.data.id,
      'READY',
    );
    expect(readyOperation.v1PurgeData.sourcePrefix).toBe(redis.prefix);
    expect(readyOperation.v1PurgeData.migrationCompletedAt).toBeDefined();
    expect(readyOperation.v1PurgeData.keysFound).toBe(4);

    await control.patch(`/api/operations/${createRes.data.id}`, {
      status: 'EXECUTING',
    });
    const doneOperation = await waitForOperation(
      subject,
      createRes.data.id,
      'DONE',
    );
    expect(doneOperation.v1PurgeData.purgedCount).toBe(4);

    expect(await redisClient.exists(`${redis.prefix}workspace_mocks`)).toBe(0);
    expect(await redisClient.exists(`${redis.prefix}mocks_deployment`)).toBe(0);
    expect(await redisClient.exists(`${redis.prefix}flags:purge:a`)).toBe(0);
    expect(
      await redisClient.exists(`${redis.prefix}mock_failure:${mock.id}`),
    ).toBe(0);
    expect(
      await redisClient.exists(`${redis.prefix}unrelated-service-key`),
    ).toBe(1);
    expect(await redisClient.exists(`${v2Prefix}workspace_mocks`)).toBe(1);
    expect(await redisClient.exists(`${v2Prefix}flags:purge:a`)).toBe(1);

    expect((await subject.client.get('/purged')).status).toBe(200);
  });
});

async function createV1MigrationSubject() {
  return await createRedisSubject({
    options: { '--ui': true, '--watch': false },
    mode: 'url',
    env: { MOCKO_V1_MIGRATION_ENABLED: 'true' },
  });
}

let v1MockCounter = 0;

function aV1Mock(overrides: Partial<V1Mock> = {}): V1Mock {
  v1MockCounter += 1;

  return {
    id: `00000000-0000-4000-8000-${String(v1MockCounter).padStart(12, '0')}`,
    name: `v1 mock ${v1MockCounter}`,
    method: 'GET',
    path: `/v1-mock-${v1MockCounter}`,
    response: { code: 200, body: `body ${v1MockCounter}`, headers: {} },
    isEnabled: true,
    ...overrides,
  };
}

async function seedV1Mock(
  client: Redis.Redis,
  prefix: string,
  mock: V1Mock,
): Promise<void> {
  await client.hset(`${prefix}workspace_mocks`, mock.id, JSON.stringify(mock));
}

async function seedV1Flag(
  client: Redis.Redis,
  prefix: string,
  key: string,
  value: unknown,
  ttlMillis?: number,
): Promise<void> {
  const payload = JSON.stringify(value);
  if (ttlMillis) {
    await client.set(`${prefix}flags:${key}`, payload, 'PX', ttlMillis);
  } else {
    await client.set(`${prefix}flags:${key}`, payload);
  }
}

async function runMigration(subject: MockoInstance, sourcePrefix: string) {
  const control = subject.ensureControl();
  const createRes = await control.post('/api/operations', {
    type: 'V1_MIGRATION',
    v1MigrationData: { sourcePrefix },
  });
  expect(createRes.status).toBe(201);
  await waitForOperation(subject, createRes.data.id, 'READY');
  const executeRes = await control.patch(
    `/api/operations/${createRes.data.id}`,
    { status: 'EXECUTING' },
  );
  expect(executeRes.status).toBe(200);
  return await waitForOperation(subject, createRes.data.id, 'DONE');
}

async function getFlag(subject: MockoInstance, key: string) {
  return await subject
    .ensureControl()
    .get(`/api/flags/${encodeURIComponent(key)}`);
}

async function waitForOperation(
  subject: MockoInstance,
  id: string,
  status: string,
) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const res = await subject.ensureControl().get('/api/operations');
    expect(res.status).toBe(200);
    const operation = res.data.operations.find((item: any) => item.id === id);
    if (operation?.status === status) {
      return operation;
    }
    if (operation?.status === 'FAILED') {
      throw new Error(`Operation ${id} FAILED while waiting for ${status}`);
    }
    await sleep(100);
  }

  throw new Error(`Timed out waiting for operation ${id} to become ${status}`);
}
