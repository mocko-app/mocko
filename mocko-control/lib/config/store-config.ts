import type { RedisOptions } from "ioredis";

export type StoreConfig = {
  coreUrl: string;
  deploySecret: string;
  redisEnabled: boolean;
  redisUrl?: string;
  redisOptions: RedisOptions;
  redisPrefix: string;
  flagsListLimit: number;
};

const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_DATABASE = 0;
const DEFAULT_REDIS_PREFIX = "mocko:";
const DEFAULT_FLAGS_LIST_LIMIT = 200;

export function getStoreConfig(env = process.env): StoreConfig {
  return {
    coreUrl: (env["MOCKO_CORE_URL"] ?? "").replace(/\/+$/, ""),
    deploySecret: env["MOCKO_DEPLOY_SECRET"] ?? "",
    redisEnabled: env["REDIS_ENABLED"] === "true",
    redisUrl: env["REDIS_URL"] || undefined,
    redisOptions: {
      host: env["REDIS_HOST"] || "127.0.0.1",
      port: parseNumber(env["REDIS_PORT"], DEFAULT_REDIS_PORT),
      password: env["REDIS_PASSWORD"] || undefined,
      db: parseNumber(env["REDIS_DATABASE"], DEFAULT_REDIS_DATABASE),
      keyPrefix: getRedisPrefix(env["REDIS_PREFIX"]),
    },
    redisPrefix: getRedisPrefix(env["REDIS_PREFIX"]),
    flagsListLimit: parseNumber(
      env["FLAGS_LIST_LIMIT"] ?? env["FLAGS_LIST-LIMIT"],
      DEFAULT_FLAGS_LIST_LIMIT,
    ),
  };
}

function getRedisPrefix(value?: string): string {
  const prefix = value?.trim() || DEFAULT_REDIS_PREFIX;
  return `${prefix.endsWith(":") ? prefix : `${prefix}:`}v2:`;
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
