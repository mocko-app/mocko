import Redis from 'ioredis';
import { MockoInstance, InstanceOptions } from './instance';

export type RedisConnectionMode = 'url' | 'params';

export type RedisTestConfig = {
  db: number;
  prefix: string;
};

const REDIS_HOST = '127.0.0.1';
const REDIS_PORT = 6379;
const DEFAULT_REDIS_DATABASE = 15;
const DEFAULT_REDIS_PREFIX = 'mocko:test:';
const IS_REDIS_ENABLED = process.env.REDIS_TESTS_ENABLED === 'true';

export const describeRedis = IS_REDIS_ENABLED ? describe : describe.skip;
export const itRedis = IS_REDIS_ENABLED ? it : it.skip;

export function createRedisTestConfig(
  overrides: Partial<RedisTestConfig> = {},
): RedisTestConfig {
  return {
    db: overrides.db ?? DEFAULT_REDIS_DATABASE,
    prefix:
      overrides.prefix ??
      `${DEFAULT_REDIS_PREFIX}${Math.random().toString(36).slice(2, 10)}:`,
  };
}

export function buildRedisUrl(config: RedisTestConfig): string {
  return `redis://${REDIS_HOST}:${REDIS_PORT}/${config.db}`;
}

export function buildRedisEnv(
  mode: RedisConnectionMode,
  config: RedisTestConfig,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    REDIS_ENABLED: 'true',
    REDIS_PREFIX: config.prefix,
  };

  if (mode === 'url') {
    env.REDIS_URL = buildRedisUrl(config);
    return env;
  }

  env.REDIS_HOST = REDIS_HOST;
  env.REDIS_PORT = String(REDIS_PORT);
  env.REDIS_DATABASE = String(config.db);
  return env;
}

export function getEffectiveRedisPrefix(prefix: string): string {
  return `${prefix.endsWith(':') ? prefix : `${prefix}:`}v2:`;
}

export function createRedisClient(config: RedisTestConfig): Redis.Redis {
  return new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: config.db,
  });
}

export async function flushRedis(config: RedisTestConfig): Promise<void> {
  const redis = createRedisClient(config);
  try {
    await redis.flushdb();
  } finally {
    redis.disconnect();
  }
}

type RedisSubjectInput = {
  options?: InstanceOptions;
  env?: NodeJS.ProcessEnv;
  mode?: RedisConnectionMode;
  redis?: Partial<RedisTestConfig>;
};

export async function createRedisSubject(
  input: RedisSubjectInput = {},
): Promise<{ subject: MockoInstance; redis: RedisTestConfig }> {
  const redis = createRedisTestConfig(input.redis);
  const mode = input.mode ?? 'url';
  const options: InstanceOptions = {
    '--watch': true,
    ...(input.options ?? {}),
  };
  const env = { ...(input.env ?? {}) };

  if (mode === 'url') {
    options['-r'] = buildRedisUrl(redis);
    env.REDIS_PREFIX = redis.prefix;
  } else {
    Object.assign(env, buildRedisEnv('params', redis));
  }

  const subject = new MockoInstance(options, env);
  await subject.init();
  return { subject, redis };
}

export async function createRedisReplicaSet(
  inputs: RedisSubjectInput[],
  redisOverrides: Partial<RedisTestConfig> = {},
): Promise<{ instances: MockoInstance[]; redis: RedisTestConfig }> {
  const redis = createRedisTestConfig(redisOverrides);
  const instances: MockoInstance[] = [];

  for (const input of inputs) {
    const { subject } = await createRedisSubject({
      ...input,
      redis,
    });
    instances.push(subject);
  }

  return { instances, redis };
}
