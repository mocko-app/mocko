import { AxiosInstance } from 'axios';
import {
  createRedisReplicaSet,
  describeRedis,
  flushRedis,
  MockoInstance,
  randomPath,
  RedisTestConfig,
} from '../../harness';

async function waitForBody(
  client: AxiosInstance,
  path: string,
  expected: string,
  timeout = 5000,
): Promise<void> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const res = await client.get(path);
    if (res.status === 200 && res.data === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Timed out waiting for ${path} to return "${expected}"`);
}

describeRedis.skip('redis multi replica reload', () => {
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

    await waitForBody(instances[0].client, route, 'replica-v1');
    await waitForBody(instances[1].client, route, 'replica-v1');

    const patchRes = await control.patch(`/api/mocks/${createdMock.id}`, {
      response: {
        code: 200,
        body: 'replica-v2',
      },
    });
    expect(patchRes.status).toBe(200);

    await waitForBody(instances[0].client, route, 'replica-v2');
    await waitForBody(instances[1].client, route, 'replica-v2');
  });
});
