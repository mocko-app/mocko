import { MockoClient } from '@mocko/sdk';
import {
  createRedisSubject,
  describeRedis,
  flushRedis,
  MockoInstance,
  RedisTestConfig,
} from '../../harness';

type UserProfile = {
  status: string;
  roles: string[];
};

describeRedis('redis sdk flags', () => {
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

  it('supports raw flag lifecycle against redis-backed core', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--watch': false },
      mode: 'url',
    }));
    const mocko = sdkClient(subject);
    const prefix = randomFlagPrefix();
    const stringKey = `${prefix}:raw:status`;
    const objectKey = `${prefix}:raw:profile`;
    const arrayKey = `${prefix}:raw:roles`;
    const profile: UserProfile = {
      status: 'active',
      roles: ['admin', 'reviewer'],
    };
    const roles = ['admin', 'reviewer'];

    await mocko.setFlag(stringKey, 'active');
    await mocko.setFlag(objectKey, profile);
    await mocko.setFlag(arrayKey, roles);

    expect(await mocko.getFlag<string>(stringKey)).toBe('active');
    expect(await mocko.getFlag<UserProfile>(objectKey)).toEqual(profile);
    expect(await mocko.getFlag<string[]>(arrayKey)).toEqual(roles);

    await mocko.deleteFlag(stringKey);
    await mocko.deleteFlag(objectKey);
    await mocko.deleteFlag(arrayKey);

    expect(await mocko.getFlag<string>(stringKey)).toBeUndefined();
    expect(await mocko.getFlag<UserProfile>(objectKey)).toBeUndefined();
    expect(await mocko.getFlag<string[]>(arrayKey)).toBeUndefined();
  });

  it('supports typed flag definitions against redis-backed core', async () => {
    ({ subject, redis } = await createRedisSubject({
      options: { '--watch': false },
      mode: 'url',
    }));
    const mocko = sdkClient(subject);
    const prefix = randomFlagPrefix();
    const profile: UserProfile = {
      status: 'active',
      roles: ['admin', 'reviewer'],
    };
    const userProfile = mocko
      .defineFlag<UserProfile>('Redis SDK user profile')
      .pattern(`${prefix}:users:{id}:profile`);

    await userProfile.set('user-123', profile);

    expect(await userProfile.get('user-123')).toEqual(profile);

    await userProfile.delete('user-123');

    expect(await userProfile.get('user-123')).toBeUndefined();
  });
});

function sdkClient(subject: MockoInstance): MockoClient {
  return new MockoClient(`http://127.0.0.1:${subject.port}`);
}

function randomFlagPrefix(): string {
  return `sdk:redis:${Math.random().toString(36).slice(2, 10)}`;
}
