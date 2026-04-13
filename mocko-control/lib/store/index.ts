import Redis from "ioredis";
import { getStoreConfig, type StoreConfig } from "@/lib/config/store-config";
import { MemoryStore } from "@/lib/store/memory-store";
import { RedisStore } from "@/lib/store/redis-store";
import type { Store } from "@/lib/store/store";
import { CoreClient } from "@/lib/store/core-client";

declare global {
  var __mockoStore: Store | undefined;
}

export function createStore(config: StoreConfig): Store {
  const coreClient = new CoreClient(config.coreUrl, config.deploySecret);

  if (config.redisEnabled) {
    const redis = config.redisUrl
      ? new Redis(config.redisUrl, config.redisOptions)
      : new Redis(config.redisOptions);

    return new RedisStore(
      redis,
      config.redisPrefix,
      config.flagsListLimit,
      coreClient,
    );
  }

  return new MemoryStore(coreClient);
}

export function getStore(): Store {
  if (!globalThis.__mockoStore) {
    globalThis.__mockoStore = createStore(getStoreConfig());
  }

  return globalThis.__mockoStore;
}
