import {
  createRedisClient,
  createRedisReplicaSet,
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
});
