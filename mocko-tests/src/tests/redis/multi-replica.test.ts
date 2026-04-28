import {
  createRedisReplicaSet,
  describeRedis,
  flushRedis,
  MockoInstance,
  randomPath,
  RedisTestConfig,
} from '../../harness';

describeRedis('redis multi replica reload', () => {
  let instances: MockoInstance[] = [];
  let redis: RedisTestConfig | null = null;

  afterEach(async () => {
    await Promise.all(instances.map((instance) => instance.stop()));
    instances = [];
    if (redis) {
      await flushRedis(redis);
      redis = null;
    }
  });

  it('propagates deploy reloads to every replica sharing the same redis backend', async () => {
    const route = randomPath();
    const replicaSet = await createRedisReplicaSet(
      [{ options: { '--ui': true }, mode: 'url' }, { mode: 'url' }],
      {},
    );
    instances = replicaSet.instances;
    redis = replicaSet.redis;
    const initialRevisions = await Promise.all(
      instances.map((instance) => instance.getRevision()),
    );

    const control = instances[0].ensureControl();
    const createRes = await control.post('/api/mocks', {
      name: 'replicated mock',
      method: 'GET',
      path: route,
      response: {
        code: 200,
        body: 'replica-v1',
        headers: {},
      },
    });
    expect(createRes.status).toBe(201);
    const createdMock = createRes.data;

    await Promise.all(
      instances.map((instance, index) =>
        instance.waitForRemap(initialRevisions[index]),
      ),
    );
    expect((await instances[0].client.get(route)).data).toBe('replica-v1');
    expect((await instances[1].client.get(route)).data).toBe('replica-v1');

    const updatedRevisions = await Promise.all(
      instances.map((instance) => instance.getRevision()),
    );

    const patchRes = await control.patch(`/api/mocks/${createdMock.id}`, {
      response: {
        code: 200,
        body: 'replica-v2',
      },
    });
    expect(patchRes.status).toBe(200);

    await Promise.all(
      instances.map((instance, index) =>
        instance.waitForRemap(updatedRevisions[index]),
      ),
    );
    expect((await instances[0].client.get(route)).data).toBe('replica-v2');
    expect((await instances[1].client.get(route)).data).toBe('replica-v2');
  });
});
