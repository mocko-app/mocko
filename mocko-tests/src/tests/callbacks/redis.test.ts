import {
  CaptureServer,
  createCaptureServer,
  createRedisSubject,
  createRedisTestConfig,
  describeRedis,
  flushRedis,
  MockoInstance,
  randomPath,
  RedisTestConfig,
} from '../../harness';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function definitions(capture: CaptureServer): string {
  return `
    host "target" {
      source      = "target.local"
      destination = "${capture.url}"
    }

    callback "durable" {
      host = "target"
      path = "/durable/{{payload.id}}"
      body = "{ \\"id\\": \\"{{payload.id}}\\" }"
    }
  `;
}

describeRedis('callback scheduling on redis', () => {
  describe('durability across restarts', () => {
    let capture: CaptureServer;
    let redis: RedisTestConfig;

    beforeAll(async () => {
      capture = await createCaptureServer();
      redis = createRedisTestConfig();
    });

    afterAll(async () => {
      await capture.stop();
      await flushRedis(redis);
    });

    it('fires a pending callback scheduled before a restart', async () => {
      const first = await createRedisSubject({ redis });
      await first.subject.createMock(definitions(capture));

      const fired = await first.subject.client.post(
        '/__mocko__/callbacks/durable/fire',
        { payload: { id: 'survivor' }, delay: 3000 },
      );
      expect(fired.status).toBe(202);
      await first.subject.stop();

      const second = await createRedisSubject({ redis });
      try {
        await second.subject.createMock(definitions(capture));

        const pending = await second.subject.client.get(
          '/__mocko__/callbacks/pending',
        );
        expect(pending.data).toHaveLength(1);
        expect(pending.data[0].slug).toBe('durable');

        await capture.waitForRequests(1, 10_000);
        expect(capture.requests[0].url).toBe('/durable/survivor');
      } finally {
        await second.subject.stop();
      }
    }, 30_000);
  });

  describe('multi-replica behavior', () => {
    let capture: CaptureServer;
    let redis: RedisTestConfig;
    let replicaA: MockoInstance;
    let replicaB: MockoInstance;

    beforeAll(async () => {
      capture = await createCaptureServer();
      redis = createRedisTestConfig();
      const [a, b] = await Promise.all([
        createRedisSubject({ redis }),
        createRedisSubject({ redis }),
      ]);
      replicaA = a.subject;
      replicaB = b.subject;
      await replicaA.createMock(definitions(capture));
      await replicaB.createMock(definitions(capture));
    }, 30_000);

    afterAll(async () => {
      await Promise.all([replicaA.stop(), replicaB.stop()]);
      await capture.stop();
      await flushRedis(redis);
    });

    it('delivers each callback exactly once across replicas', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await replicaA.client.post(
          '/__mocko__/callbacks/durable/fire',
          { payload: { id: `cb-${i}` }, delay: 1000 },
        );
        expect(res.status).toBe(202);
      }

      await capture.waitForRequests(5, 15_000);
      await sleep(1500);

      expect(capture.requests).toHaveLength(5);
      const urls = capture.requests.map((request) => request.url).sort();
      expect(urls).toEqual([
        '/durable/cb-0',
        '/durable/cb-1',
        '/durable/cb-2',
        '/durable/cb-3',
        '/durable/cb-4',
      ]);
    }, 30_000);

    it('delivers a mock-triggered callback once and shows it pending from the other replica', async () => {
      const path = randomPath();
      await replicaA.createMock(`
        mock "GET ${path}" {
          body = "{{callback 'durable' (object id='mock-triggered') delay=5000}}scheduled"
        }
      `);
      capture.clear();

      const res = await replicaA.client.get(path);
      expect(res.status).toBe(200);

      let entry: { slug: string; triggeredByMockId?: string } | undefined;
      for (let attempt = 0; attempt < 40 && !entry; attempt++) {
        const fromB = await replicaB.client.get('/__mocko__/callbacks/pending');
        entry = fromB.data.find(
          (item: { slug: string }) => item.slug === 'durable',
        );
        if (!entry) {
          await sleep(50);
        }
      }
      expect(entry).toBeDefined();
      expect(entry?.triggeredByMockId).toBeDefined();

      await capture.waitForRequests(1, 15_000);
      await sleep(1500);
      expect(capture.requests).toHaveLength(1);
      expect(capture.requests[0].url).toBe('/durable/mock-triggered');
    }, 30_000);

    it('shows a cluster-accurate pending list from any replica', async () => {
      const fired = await replicaA.client.post(
        '/__mocko__/callbacks/durable/fire',
        { payload: { id: 'visible' }, delay: 60_000 },
      );

      const fromB = await replicaB.client.get('/__mocko__/callbacks/pending');
      expect(fromB.data.map((entry: { id: string }) => entry.id)).toContain(
        fired.data.id,
      );

      const cancelled = await replicaB.client.delete(
        `/__mocko__/callbacks/pending/${fired.data.id}`,
      );
      expect(cancelled.status).toBe(204);

      const fromA = await replicaA.client.get('/__mocko__/callbacks/pending');
      expect(fromA.data.map((entry: { id: string }) => entry.id)).not.toContain(
        fired.data.id,
      );
    });
  });
});
