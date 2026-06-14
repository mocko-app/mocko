import { MockoClient } from '@mocko/sdk';
import {
  createRedisClient,
  createRedisSubject,
  describeRedis,
  flushRedis,
  getEffectiveRedisPrefix,
  MockoInstance,
  randomPath,
  RedisTestConfig,
  setControlFlag,
} from '../../harness';

jest.setTimeout(45000);

describeRedis('redis flag metadata', () => {
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

  it('stores all flag writers in the same Redis hash format', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
    }));
    const control = subject.ensureControl();
    const redisClient = createRedisClient(redis);
    const prefix = randomFlagPrefix();
    const mockKey = `${prefix}:mock`;
    const controlKey = `${prefix}:control`;
    const sdkKey = `${prefix}:sdk`;
    const mockPath = randomPath();

    try {
      await subject.createMock(`
        mock "PUT ${mockPath}" {
          body = "{{setFlag '${mockKey}' request.body.value}}"
        }
      `);

      const mockWriteRes = await subject.client.put(mockPath, {
        value: 'from-mock',
      });
      expect(mockWriteRes.status).toBe(200);

      const controlWriteRes = await setControlFlag(
        control,
        controlKey,
        'from-control',
      );
      expect(controlWriteRes.status).toBe(200);

      const sdk = new MockoClient(`http://127.0.0.1:${subject.port}`);
      await sdk.setFlag(sdkKey, 'from-sdk', 30);

      const mockHash = await redisClient.hgetall(redisFlagKey(redis, mockKey));
      const controlHash = await redisClient.hgetall(
        redisFlagKey(redis, controlKey),
      );
      const sdkHash = await redisClient.hgetall(redisFlagKey(redis, sdkKey));

      expect(await redisClient.type(redisFlagKey(redis, mockKey))).toBe('hash');
      expect(await redisClient.type(redisFlagKey(redis, controlKey))).toBe(
        'hash',
      );
      expect(await redisClient.type(redisFlagKey(redis, sdkKey))).toBe('hash');

      expect(mockHash.value).toBe('"from-mock"');
      expectIsoTimestamp(mockHash.mockUpdatedAt);
      expect(mockHash.controlUpdatedAt).toBeUndefined();
      expect(mockHash.sdkUpdatedAt).toBeUndefined();

      expect(controlHash.value).toBe('"from-control"');
      expectIsoTimestamp(controlHash.controlUpdatedAt);
      expect(controlHash.mockUpdatedAt).toBeUndefined();
      expect(controlHash.sdkUpdatedAt).toBeUndefined();

      expect(sdkHash.value).toBe('"from-sdk"');
      expectIsoTimestamp(sdkHash.sdkUpdatedAt);
      expect(sdkHash.mockUpdatedAt).toBeUndefined();
      expect(sdkHash.controlUpdatedAt).toBeUndefined();
      expect(
        await redisClient.pttl(redisFlagKey(redis, sdkKey)),
      ).toBeGreaterThan(0);

      const controlReadMock = await control.get(
        `/api/flags/${encodeURIComponent(mockKey)}`,
      );
      expect(controlReadMock.status).toBe(200);
      expect(controlReadMock.data.value).toBe('"from-mock"');
      expectIsoTimestamp(controlReadMock.data.mockUpdatedAt);

      const coreReadControl = await subject.client.get(
        `/__mocko__/flags/${encodeURIComponent(controlKey)}`,
      );
      expect(coreReadControl.status).toBe(200);
      expect(coreReadControl.data.value).toBe('"from-control"');
      expectIsoTimestamp(coreReadControl.data.controlUpdatedAt);

      const controlReadSdk = await control.get(
        `/api/flags/${encodeURIComponent(sdkKey)}`,
      );
      expect(controlReadSdk.status).toBe(200);
      expect(controlReadSdk.data.value).toBe('"from-sdk"');
      expectIsoTimestamp(controlReadSdk.data.sdkUpdatedAt);
    } finally {
      redisClient.disconnect();
    }
  });

  it('treats null flag values as existing flags', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--ui': true },
      mode: 'url',
    }));
    const control = subject.ensureControl();
    const redisClient = createRedisClient(redis);
    const flagKey = `${randomFlagPrefix()}:null`;
    const setPath = randomPath();
    const hasPath = randomPath();

    try {
      await subject.createMock(`
        mock "PUT ${setPath}" {
          body = "{{setFlag '${flagKey}' request.body.value}}"
        }
        mock "GET ${hasPath}" {
          body = "{{#hasFlag '${flagKey}'}}yes{{else}}no{{/hasFlag}}"
        }
      `);

      const writeRes = await subject.client.put(setPath, { value: null });
      expect(writeRes.status).toBe(200);

      const flagFields = await redisClient.hgetall(
        redisFlagKey(redis, flagKey),
      );
      expect(flagFields.value).toBe('null');
      expectIsoTimestamp(flagFields.mockUpdatedAt);

      const controlRead = await control.get(
        `/api/flags/${encodeURIComponent(flagKey)}`,
      );
      expect(controlRead.status).toBe(200);
      expect(controlRead.data.value).toBe('null');
      expectIsoTimestamp(controlRead.data.mockUpdatedAt);

      const hasRes = await subject.client.get(hasPath);
      expect(hasRes.status).toBe(200);
      expect(hasRes.data).toBe('yes');
    } finally {
      redisClient.disconnect();
    }
  });
});

function redisFlagKey(redis: RedisTestConfig, key: string): string {
  return `${getEffectiveRedisPrefix(redis.prefix)}flags:${key}`;
}

function expectIsoTimestamp(value: unknown): void {
  expect(typeof value).toBe('string');
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

function randomFlagPrefix(): string {
  return `metadata:${Math.random().toString(36).slice(2, 10)}`;
}
