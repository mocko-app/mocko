import {
  createCaptureServer,
  createRedisClient,
  createRedisReplicaSet,
  createRedisSubject,
  createRedisTestConfig,
  describeRedis,
  flushRedis,
  getEffectiveRedisPrefix,
  MockoInstance,
  RedisTestConfig,
} from '../../harness';

function findCallback(list: any[], slug: string) {
  const callback = list.find((item) => item.slug === slug);
  expect(callback).toBeTruthy();
  return callback;
}

describeRedis('redis callbacks persistence', () => {
  let replicas: MockoInstance[] = [];
  let redis: RedisTestConfig | null = null;

  afterEach(async () => {
    await Promise.all(replicas.map((replica) => replica.stop()));
    replicas = [];
    if (redis) {
      await flushRedis(redis);
      redis = null;
    }
  });

  it('gives legacy ui callbacks without ids a stable id shared by replicas and persists it on the next write', async () => {
    redis = createRedisTestConfig();
    const callbacksKey = `${getEffectiveRedisPrefix(redis.prefix)}callbacks`;
    const legacyCallbacks = [
      {
        slug: 'legacy',
        method: 'POST',
        url: `http://localhost:1/legacy`,
        delay: 0,
        headers: {},
        annotations: [],
      },
      {
        slug: 'Legacy-two',
        method: 'POST',
        url: `http://localhost:1/legacy-two`,
        delay: 0,
        headers: {},
        annotations: [],
      },
    ];
    const redisClient = createRedisClient(redis);
    try {
      await redisClient.set(callbacksKey, JSON.stringify(legacyCallbacks));

      const replicaSet = await createRedisReplicaSet(
        [
          { options: { '--ui': true }, mode: 'url' },
          { options: { '--ui': true }, mode: 'url' },
        ],
        redis,
      );
      replicas = replicaSet.instances;
      const [first, second] = replicas.map((replica) =>
        replica.ensureControl(),
      );

      const firstList = await first.get('/api/callbacks');
      expect(firstList.status).toBe(200);
      const legacyId = findCallback(firstList.data, 'legacy').id;
      const legacyTwoId = findCallback(firstList.data, 'Legacy-two').id;
      expect(legacyId).toEqual(expect.any(String));
      expect(legacyTwoId).not.toBe(legacyId);

      expect(
        findCallback((await first.get('/api/callbacks')).data, 'legacy').id,
      ).toBe(legacyId);
      const secondList = await second.get('/api/callbacks');
      expect(findCallback(secondList.data, 'legacy').id).toBe(legacyId);
      expect(findCallback(secondList.data, 'Legacy-two').id).toBe(legacyTwoId);

      const detailsRes = await second.get(`/api/callbacks/${legacyId}`);
      expect(detailsRes.status).toBe(200);
      expect(detailsRes.data.slug).toBe('legacy');
      expect((await second.get('/api/callbacks/legacy')).status).toBe(404);

      expect(
        JSON.parse((await redisClient.get(callbacksKey)) as string)[0].id,
      ).toBeUndefined();

      const createRes = await first.post('/api/callbacks', {
        slug: 'fresh',
        url: `http://localhost:1/fresh`,
      });
      expect(createRes.status).toBe(201);

      const persisted = JSON.parse(
        (await redisClient.get(callbacksKey)) as string,
      );
      expect(persisted.map((callback: { id: string }) => callback.id)).toEqual([
        legacyId,
        legacyTwoId,
        createRes.data.id,
      ]);

      const patchRes = await second.patch(`/api/callbacks/${legacyTwoId}`, {
        method: 'PUT',
        url: `http://localhost:1/legacy-two-updated`,
      });
      expect(patchRes.status).toBe(200);
      expect(patchRes.data.id).toBe(legacyTwoId);

      expect(
        findCallback((await first.get('/api/callbacks')).data, 'Legacy-two'),
      ).toMatchObject({
        id: legacyTwoId,
        method: 'PUT',
        url: `http://localhost:1/legacy-two-updated`,
      });
    } finally {
      redisClient.disconnect();
    }
  });

  it('overrides a file callback with a ui callback and rejects a second ui callback in redis mode', async () => {
    const fileTarget = await createCaptureServer();
    const uiTarget = await createCaptureServer();
    try {
      const created = await createRedisSubject({
        options: { '--ui': true },
        mode: 'url',
      });
      replicas = [created.subject];
      redis = created.redis;
      const subject = created.subject;

      await subject.createMock(`
        callback "overridden" {
          url = "${fileTarget.url}/from-file"
        }
        mock "POST /trigger-overridden" {
          body = "{{callback 'overridden'}}{}"
        }
      `);

      const control = subject.ensureControl();
      const revision = await subject.getRevision();
      const createRes = await control.post('/api/callbacks', {
        slug: 'Overridden',
        url: `${uiTarget.url}/from-ui`,
      });
      expect(createRes.status).toBe(201);
      await subject.waitForRemap(revision);

      const duplicateRes = await control.post('/api/callbacks', {
        slug: 'OVERRIDDEN',
        url: `${uiTarget.url}/second`,
      });
      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.data.code).toBe('CALLBACK_SLUG_CONFLICT');

      const triggerRes = await subject.client.post('/trigger-overridden', {});
      expect(triggerRes.status).toBe(201);
      await uiTarget.waitForRequests(1);
      expect(uiTarget.requests[0].url).toBe('/from-ui');

      const fileCallback = (await control.get('/api/callbacks')).data.find(
        (callback: { annotations: string[] }) =>
          callback.annotations.includes('READ_ONLY'),
      );
      expect(fileCallback.annotations).toEqual(['READ_ONLY', 'SHADOWED']);
      const fireRes = await control.post(
        `/api/callbacks/${fileCallback.id}/fire`,
        {},
      );
      expect(fireRes.status).toBe(409);
      expect(fireRes.data.code).toBe('CALLBACK_SHADOWED');
      expect(fileTarget.requests).toHaveLength(0);
    } finally {
      await fileTarget.stop();
      await uiTarget.stop();
    }
  });
});
