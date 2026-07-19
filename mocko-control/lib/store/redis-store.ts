import Redis, { type Redis as RedisClient, type RedisOptions } from "ioredis";
import { toV2Mock } from "@/lib/management/v1-mock.mapper";
import { toDeployDefinition } from "@/lib/mock/mock.mapper";
import { CoreClient } from "@/lib/store/core-client";
import { Store, type FlagListResult, type StoreFlag } from "@/lib/store/store";
import type { Callback } from "@/lib/types/callback";
import type { FlagKey, FlagSource } from "@/lib/types/flag";
import type { Host } from "@/lib/types/host";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock } from "@/lib/types/mock";
import type {
  MatchingFlagsMode,
  Operation,
  OperationStatus,
  OperationUpdate,
} from "@/lib/types/operation";

const WORKSPACE_MOCKS_KEY = "workspace_mocks";
const HOSTS_KEY = "hosts";
const CALLBACKS_KEY = "callbacks";
const DEPLOYMENT_KEY = "mocks_deployment";
const FLAG_PREFIX = "flags:";
const FAILURE_PREFIX = "mock_failure:";
const RELOAD_CHANNEL = "mocko:deploy";
const MANAGEMENT_OPERATIONS_PREFIX = "management:operations:";
const MANAGEMENT_OPERATIONS_INDEX_KEY = "management:operations:index";
const MANAGEMENT_FLAG_KEYS_PREFIX = "management:flag-keys:";
const MANAGEMENT_SENTINEL_KEY = "management:sentinel";
const REDIS_SCAN_COUNT = 10_000;
const PROGRESS_UPDATE_INTERVAL_MS = 1_000;
const OPERATIONS_BATCH_SIZE = 1_000;
type GroupCounts = {
  total: number;
  matches: number;
};

type RedisFlagFields = {
  value?: string;
  mockUpdatedAt?: string;
  controlUpdatedAt?: string;
  sdkUpdatedAt?: string;
};

export class RedisStore extends Store {
  readonly isManagementSupported = true;

  private readonly redis: RedisClient;

  constructor(
    private readonly redisUrl: string | undefined,
    private readonly redisOptions: RedisOptions,
    private readonly redisPrefix: string,
    private readonly flagsListLimit: number,
    coreClient: CoreClient,
  ) {
    super(coreClient);
    this.redis = redisUrl
      ? new Redis(redisUrl, redisOptions)
      : new Redis(redisOptions);
    void this.ensureManagementSentinel().catch((error) => {
      console.error("Failed to initialize management sentinel:", error);
    });
  }

  protected async listOwnMocks(): Promise<Mock[]> {
    return this.readOwnMocks();
  }

  protected async getOwnMock(id: string): Promise<Mock | null> {
    const mocks = await this.readOwnMocks();
    return mocks.find((mock) => mock.id === id) ?? null;
  }

  async saveMock(mock: Mock): Promise<void> {
    const mocks = await this.readOwnMocks();
    const index = mocks.findIndex((item) => item.id === mock.id);
    if (index === -1) {
      mocks.push(mock);
    } else {
      mocks[index] = mock;
    }
    await this.writeOwnMocks(mocks);
  }

  getCreatedAnnotations(): [] {
    return [];
  }

  async deleteMock(id: string): Promise<boolean> {
    const mocks = await this.readOwnMocks();
    const nextMocks = mocks.filter((mock) => mock.id !== id);
    if (nextMocks.length === mocks.length) {
      return false;
    }

    await this.writeOwnMocks(nextMocks);
    return true;
  }

  async clearFailure(mockId: string): Promise<void> {
    await this.redis.del(`${FAILURE_PREFIX}${mockId}`);
  }

  protected async listOwnHosts(): Promise<Host[]> {
    return this.readOwnHosts();
  }

  protected async getOwnHost(slug: string): Promise<Host | null> {
    const hosts = await this.readOwnHosts();
    return hosts.find((host) => host.slug === slug) ?? null;
  }

  async saveHost(host: Host): Promise<void> {
    const hosts = await this.readOwnHosts();
    const index = hosts.findIndex((item) => item.slug === host.slug);
    if (index === -1) {
      hosts.push(host);
    } else {
      hosts[index] = host;
    }
    await this.writeOwnHosts(hosts);
  }

  async deleteHost(slug: string): Promise<boolean> {
    const hosts = await this.readOwnHosts();
    const nextHosts = hosts.filter((host) => host.slug !== slug);
    if (nextHosts.length === hosts.length) {
      return false;
    }

    await this.writeOwnHosts(nextHosts);
    return true;
  }

  protected async listOwnCallbacks(): Promise<Callback[]> {
    return this.readOwnCallbacks();
  }

  protected async getOwnCallback(slug: string): Promise<Callback | null> {
    const callbacks = await this.readOwnCallbacks();
    return callbacks.find((callback) => callback.slug === slug) ?? null;
  }

  async saveCallback(callback: Callback): Promise<void> {
    const callbacks = await this.readOwnCallbacks();
    const index = callbacks.findIndex((item) => item.slug === callback.slug);
    if (index === -1) {
      callbacks.push(callback);
    } else {
      callbacks[index] = callback;
    }
    await this.writeOwnCallbacks(callbacks);
  }

  async deleteCallback(slug: string): Promise<boolean> {
    const callbacks = await this.readOwnCallbacks();
    const nextCallbacks = callbacks.filter(
      (callback) => callback.slug !== slug,
    );
    if (nextCallbacks.length === callbacks.length) {
      return false;
    }

    await this.writeOwnCallbacks(nextCallbacks);
    return true;
  }

  async listFlags(prefix: string, search?: string): Promise<FlagListResult> {
    const normalizedPrefix = this.normalizePrefix(prefix);
    const normalizedSearch = search?.toLowerCase();
    const counts = new Map<string, GroupCounts>();
    const groups = new Set<string>();
    const flags: string[] = [];
    let cursor = "0";
    let isTruncated = false;
    const pattern = `${this.redisPrefix}${FLAG_PREFIX}${normalizedPrefix}*`;

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        REDIS_SCAN_COUNT,
      );
      cursor = nextCursor;

      for (const key of keys) {
        const fullKey = key.replace(`${this.redisPrefix}${FLAG_PREFIX}`, "");
        const relativeKey = fullKey.slice(normalizedPrefix.length);

        if (!relativeKey) {
          continue;
        }

        const groupName = relativeKey.includes(":")
          ? relativeKey.split(":")[0]
          : relativeKey;
        const currentCounts = counts.get(groupName) ?? { total: 0, matches: 0 };
        currentCounts.total += 1;

        const matchesSearch =
          !normalizedSearch || fullKey.toLowerCase().includes(normalizedSearch);
        if (matchesSearch) {
          currentCounts.matches += 1;
        }
        counts.set(groupName, currentCounts);

        if (!matchesSearch) {
          continue;
        }

        if (relativeKey.includes(":")) {
          groups.add(groupName);
        } else {
          flags.push(relativeKey);
        }

        if (groups.size + flags.length >= this.flagsListLimit) {
          isTruncated = true;
          cursor = "0";
          break;
        }
      }
    } while (cursor !== "0");

    let count = 0;
    let matchCount = 0;
    for (const groupCounts of counts.values()) {
      count += groupCounts.total;
      matchCount += groupCounts.matches;
    }

    return {
      flagKeys: [
        ...Array.from(groups).map<FlagKey>((name) => ({
          type: "PREFIX",
          name,
          count: counts.get(name)?.total,
          matchCount: counts.get(name)?.matches,
        })),
        ...flags.map<FlagKey>((name) => ({ type: "FLAG", name })),
      ],
      isTruncated,
      count,
      matchCount,
    };
  }

  async getFlag(key: string): Promise<StoreFlag | null> {
    const payload = await this.redis.hgetall(`${FLAG_PREFIX}${key}`);
    return this.deserializeFlag(key, payload);
  }

  async setFlag(
    key: string,
    value: string,
    source: FlagSource,
  ): Promise<StoreFlag> {
    const normalizedValue = JSON.stringify(JSON.parse(value));
    const fields = this.serializeFlag(normalizedValue, source);
    await this.redis.hset(`${FLAG_PREFIX}${key}`, fields);
    const flag = await this.getFlag(key);
    if (!flag) {
      throw new Error(`Flag "${key}" was not found after being written`);
    }

    return flag;
  }

  async deleteFlag(key: string): Promise<boolean> {
    const deleted = await this.redis.del(`${FLAG_PREFIX}${key}`);
    return deleted > 0;
  }

  async deploy(): Promise<void> {
    try {
      const mocks = await this.readOwnMocks();
      const hosts = await this.readOwnHosts();
      const callbacks = await this.readOwnCallbacks();
      const deployDefinition = toDeployDefinition(mocks, hosts, callbacks);
      await this.redis.set(DEPLOYMENT_KEY, JSON.stringify(deployDefinition));
      await this.redis.publish(`${this.redisPrefix}${RELOAD_CHANNEL}`, "");
    } catch (error) {
      console.error("Failed to deploy mocks to Redis:", error);
    }
  }

  async getFailure(mockId: string): Promise<MockFailure | null> {
    const rawFailure = await this.redis.get(`${FAILURE_PREFIX}${mockId}`);
    if (!rawFailure) {
      return null;
    }

    return JSON.parse(rawFailure) as MockFailure;
  }

  async health(): Promise<void> {
    await this.redis.ping();
  }

  async createOperation(op: Operation): Promise<void> {
    await this.redis.hset(
      this.operationKey(op.id),
      this.serializeOperation(op),
    );
    await this.redis.zadd(
      MANAGEMENT_OPERATIONS_INDEX_KEY,
      new Date(op.createdAt).getTime(),
      op.id,
    );
  }

  async updateOperation(id: string, fields: OperationUpdate): Promise<void> {
    const flatFields = this.serializeOperationUpdate(fields);
    if (Object.keys(flatFields).length === 0) {
      return;
    }

    await this.redis.hset(this.operationKey(id), flatFields);
    if (fields.status === "FAILED" || fields.status === "DONE") {
      await this.redis.del(this.managementFlagKeysKey(id));
    }
  }

  async listOperations(): Promise<Operation[]> {
    const operations: Operation[] = [];
    const ids = await this.redis.zrevrange(
      MANAGEMENT_OPERATIONS_INDEX_KEY,
      0,
      -1,
    );

    for (const id of ids) {
      const payload = await this.redis.hgetall(this.operationKey(id));
      const operation = this.deserializeOperation(payload);
      if (operation) {
        operations.push(operation);
      } else {
        await this.redis.zrem(MANAGEMENT_OPERATIONS_INDEX_KEY, id);
      }
    }

    return operations;
  }

  async getOperation(id: string): Promise<Operation | null> {
    const payload = await this.redis.hgetall(this.operationKey(id));
    return this.deserializeOperation(payload);
  }

  async deleteOperation(id: string): Promise<boolean> {
    const deleted = await this.redis.del(
      this.operationKey(id),
      this.managementFlagKeysKey(id),
    );
    const removedFromIndex = await this.redis.zrem(
      MANAGEMENT_OPERATIONS_INDEX_KEY,
      id,
    );
    return deleted + removedFromIndex > 0;
  }

  async getSentinelIdleSeconds(): Promise<number | null> {
    return await this.getIdleSeconds(
      `${this.redisPrefix}${MANAGEMENT_SENTINEL_KEY}`,
    );
  }

  async scanStaleFlagsForManagement(
    operationId: string,
    thresholdSeconds: number,
  ): Promise<void> {
    let cursor = "0";
    let scannedCount = 0;
    let staleFlags = 0;
    let lastProgressUpdateAt = Date.now();
    const listKey = this.managementFlagKeysKey(operationId);

    await this.redis.del(listKey);

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        "MATCH",
        `${this.redisPrefix}${FLAG_PREFIX}*`,
        "COUNT",
        REDIS_SCAN_COUNT,
      );
      cursor = nextCursor;

      if (keys.length === 0) {
        continue;
      }

      const staleKeys = await this.findStaleKeys(keys, thresholdSeconds);
      scannedCount += keys.length;
      staleFlags += staleKeys.length;

      await this.appendMatchedKeys(listKey, staleKeys);

      const shouldUpdateProgress =
        Date.now() - lastProgressUpdateAt >= PROGRESS_UPDATE_INTERVAL_MS;
      if (shouldUpdateProgress) {
        lastProgressUpdateAt = Date.now();
        await this.updateOperation(operationId, {
          staleFlagsData: { scannedCount },
        });
      }
    } while (cursor !== "0");

    await this.updateOperation(operationId, {
      status: "READY",
      staleFlagsData: { scannedCount, staleFlags },
    });
  }

  async scanMatchingFlagsForManagement(
    operationId: string,
    mode: MatchingFlagsMode,
    pattern: string,
  ): Promise<void> {
    let cursor = "0";
    let scannedCount = 0;
    let matchedCount = 0;
    let lastProgressUpdateAt = Date.now();
    const listKey = this.managementFlagKeysKey(operationId);
    const matches = this.createFlagMatcher(mode, pattern);

    await this.redis.del(listKey);

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        "MATCH",
        `${this.redisPrefix}${FLAG_PREFIX}*`,
        "COUNT",
        REDIS_SCAN_COUNT,
      );
      cursor = nextCursor;

      if (keys.length === 0) {
        continue;
      }

      const matchedKeys = this.findMatchingFlagKeys(keys, matches);
      scannedCount += keys.length;
      matchedCount += matchedKeys.length;

      await this.appendMatchedKeys(listKey, matchedKeys);

      const shouldUpdateProgress =
        Date.now() - lastProgressUpdateAt >= PROGRESS_UPDATE_INTERVAL_MS;
      if (shouldUpdateProgress) {
        lastProgressUpdateAt = Date.now();
        await this.updateOperation(operationId, {
          matchingFlagsData: { scannedCount },
        });
      }
    } while (cursor !== "0");

    await this.updateOperation(operationId, {
      status: "READY",
      matchingFlagsData: { scannedCount, matchedCount },
    });
  }

  async purgeStaleFlagsForManagement(operationId: string): Promise<void> {
    let purgedCount = 0;
    const listKey = this.managementFlagKeysKey(operationId);
    const operation = await this.getOperation(operationId);

    while (true) {
      const popped = await this.redis.lpop(listKey, OPERATIONS_BATCH_SIZE);
      const fullKeys = Array.isArray(popped) ? popped : popped ? [popped] : [];
      if (fullKeys.length === 0) {
        break;
      }

      const keys = fullKeys.flatMap((key) => {
        const relativeKey = this.toRelativeRedisKey(key);
        return relativeKey ? [relativeKey] : [];
      });
      const deleted = keys.length > 0 ? await this.redis.del(...keys) : 0;
      purgedCount += deleted;
    }

    await this.redis.del(listKey);
    const update: OperationUpdate =
      operation?.type === "MATCHING_FLAGS"
        ? {
            status: "DONE",
            completedAt: new Date().toISOString(),
            matchingFlagsData: { purgedCount },
          }
        : {
            status: "DONE",
            completedAt: new Date().toISOString(),
            staleFlagsData: { purgedCount },
          };
    await this.updateOperation(operationId, update);
  }

  async scanV1MigrationForManagement(
    operationId: string,
    sourcePrefix: string,
  ): Promise<void> {
    await this.withSourceClient(async (source) => {
      const mocksFound = await source.hlen(
        `${sourcePrefix}${WORKSPACE_MOCKS_KEY}`,
      );
      const flagsFound = await this.countSourceKeys(
        source,
        `${sourcePrefix}${FLAG_PREFIX}`,
        async (count) => {
          await this.updateOperation(operationId, {
            v1MigrationData: { flagsFound: count },
          });
        },
      );

      await this.updateOperation(operationId, {
        status: "READY",
        v1MigrationData: { mocksFound, flagsFound },
      });
    });
  }

  async executeV1MigrationForManagement(
    operationId: string,
    sourcePrefix: string,
  ): Promise<void> {
    await this.withSourceClient(async (source) => {
      const { flagsMigrated, flagsSkipped } = await this.migrateV1Flags(
        operationId,
        source,
        sourcePrefix,
      );
      const mocksMigrated = await this.migrateV1Mocks(source, sourcePrefix);
      await this.deploy();

      await this.updateOperation(operationId, {
        status: "DONE",
        completedAt: new Date().toISOString(),
        v1MigrationData: { mocksMigrated, flagsMigrated, flagsSkipped },
      });
    });
  }

  async scanV1PurgeForManagement(
    operationId: string,
    sourcePrefix: string,
  ): Promise<void> {
    await this.withSourceClient(async (source) => {
      let keysFound = await source.exists(
        `${sourcePrefix}${WORKSPACE_MOCKS_KEY}`,
        `${sourcePrefix}${DEPLOYMENT_KEY}`,
      );
      for (const prefix of [FLAG_PREFIX, FAILURE_PREFIX]) {
        const countedSoFar = keysFound;
        keysFound += await this.countSourceKeys(
          source,
          `${sourcePrefix}${prefix}`,
          async (count) => {
            await this.updateOperation(operationId, {
              v1PurgeData: { keysFound: countedSoFar + count },
            });
          },
        );
      }

      await this.updateOperation(operationId, {
        status: "READY",
        v1PurgeData: { keysFound },
      });
    });
  }

  async executeV1PurgeForManagement(
    operationId: string,
    sourcePrefix: string,
  ): Promise<void> {
    await this.withSourceClient(async (source) => {
      let purgedCount = await source.del(
        `${sourcePrefix}${WORKSPACE_MOCKS_KEY}`,
        `${sourcePrefix}${DEPLOYMENT_KEY}`,
      );
      let lastProgressUpdateAt = Date.now();

      for (const prefix of [FLAG_PREFIX, FAILURE_PREFIX]) {
        let cursor = "0";
        do {
          const [nextCursor, keys] = await source.scan(
            cursor,
            "MATCH",
            `${escapeGlobPattern(`${sourcePrefix}${prefix}`)}*`,
            "COUNT",
            REDIS_SCAN_COUNT,
          );
          cursor = nextCursor;

          for (
            let index = 0;
            index < keys.length;
            index += OPERATIONS_BATCH_SIZE
          ) {
            purgedCount += await source.del(
              ...keys.slice(index, index + OPERATIONS_BATCH_SIZE),
            );
          }

          if (
            Date.now() - lastProgressUpdateAt >=
            PROGRESS_UPDATE_INTERVAL_MS
          ) {
            lastProgressUpdateAt = Date.now();
            await this.updateOperation(operationId, {
              v1PurgeData: { purgedCount },
            });
          }
        } while (cursor !== "0");
      }

      await this.updateOperation(operationId, {
        status: "DONE",
        completedAt: new Date().toISOString(),
        v1PurgeData: { purgedCount },
      });
    });
  }

  private async migrateV1Flags(
    operationId: string,
    source: RedisClient,
    sourcePrefix: string,
  ): Promise<{ flagsMigrated: number; flagsSkipped: number }> {
    const sourceFlagPrefix = `${sourcePrefix}${FLAG_PREFIX}`;
    let flagsMigrated = 0;
    let flagsSkipped = 0;
    let cursor = "0";
    let lastProgressUpdateAt = Date.now();

    do {
      const [nextCursor, keys] = await source.scan(
        cursor,
        "MATCH",
        `${escapeGlobPattern(sourceFlagPrefix)}*`,
        "COUNT",
        REDIS_SCAN_COUNT,
      );
      cursor = nextCursor;

      for (let index = 0; index < keys.length; index += OPERATIONS_BATCH_SIZE) {
        const batch = keys.slice(index, index + OPERATIONS_BATCH_SIZE);
        const migrated = await this.copyV1FlagBatch(
          source,
          sourceFlagPrefix,
          batch,
        );
        flagsMigrated += migrated;
        flagsSkipped += batch.length - migrated;

        if (Date.now() - lastProgressUpdateAt >= PROGRESS_UPDATE_INTERVAL_MS) {
          lastProgressUpdateAt = Date.now();
          await this.updateOperation(operationId, {
            v1MigrationData: { flagsMigrated },
          });
        }
      }
    } while (cursor !== "0");

    return { flagsMigrated, flagsSkipped };
  }

  private async copyV1FlagBatch(
    source: RedisClient,
    sourceFlagPrefix: string,
    keys: string[],
  ): Promise<number> {
    const readPipeline = source.pipeline();
    for (const key of keys) {
      readPipeline.get(key);
      readPipeline.pttl(key);
    }
    const results = await readPipeline.exec();

    const writePipeline = this.redis.pipeline();
    let migrated = 0;
    keys.forEach((key, index) => {
      const [getError, value] = results?.[index * 2] ?? [null, null];
      const [pttlError, ttlMillis] = results?.[index * 2 + 1] ?? [null, -2];
      if (getError) {
        throw getError;
      }
      if (pttlError) {
        throw pttlError;
      }
      if (typeof value !== "string") {
        return;
      }

      const flagKey = `${FLAG_PREFIX}${key.slice(sourceFlagPrefix.length)}`;
      writePipeline.del(flagKey);
      writePipeline.hset(flagKey, this.serializeFlag(value, "MOCK"));
      if (typeof ttlMillis === "number" && ttlMillis > 0) {
        writePipeline.pexpire(flagKey, ttlMillis);
      }
      migrated += 1;
    });

    const writeResults = await writePipeline.exec();
    writeResults?.forEach(([error]) => {
      if (error) {
        throw error;
      }
    });

    return migrated;
  }

  private async migrateV1Mocks(
    source: RedisClient,
    sourcePrefix: string,
  ): Promise<number> {
    const entries = await source.hgetall(
      `${sourcePrefix}${WORKSPACE_MOCKS_KEY}`,
    );
    const mocks = Object.values(entries).map((raw) =>
      toV2Mock(JSON.parse(raw)),
    );
    await this.writeOwnMocks(mocks);
    return mocks.length;
  }

  private async countSourceKeys(
    source: RedisClient,
    keyPrefix: string,
    onProgress: (count: number) => Promise<void>,
  ): Promise<number> {
    let count = 0;
    let cursor = "0";
    let lastProgressUpdateAt = Date.now();

    do {
      const [nextCursor, keys] = await source.scan(
        cursor,
        "MATCH",
        `${escapeGlobPattern(keyPrefix)}*`,
        "COUNT",
        REDIS_SCAN_COUNT,
      );
      cursor = nextCursor;
      count += keys.length;

      if (Date.now() - lastProgressUpdateAt >= PROGRESS_UPDATE_INTERVAL_MS) {
        lastProgressUpdateAt = Date.now();
        await onProgress(count);
      }
    } while (cursor !== "0");

    return count;
  }

  private async withSourceClient(
    action: (source: RedisClient) => Promise<void>,
  ): Promise<void> {
    const options: RedisOptions = {
      ...this.redisOptions,
      keyPrefix: undefined,
    };
    const source = this.redisUrl
      ? new Redis(this.redisUrl, options)
      : new Redis(options);

    try {
      await action(source);
    } finally {
      source.disconnect();
    }
  }

  private async readOwnMocks(): Promise<Mock[]> {
    const payload = await this.redis.get(WORKSPACE_MOCKS_KEY);
    if (!payload) {
      return [];
    }

    return JSON.parse(payload) as Mock[];
  }

  private async writeOwnMocks(mocks: Mock[]): Promise<void> {
    await this.redis.set(WORKSPACE_MOCKS_KEY, JSON.stringify(mocks));
  }

  private async readOwnHosts(): Promise<Host[]> {
    const payload = await this.redis.get(HOSTS_KEY);
    if (!payload) {
      return [];
    }

    return JSON.parse(payload) as Host[];
  }

  private async writeOwnHosts(hosts: Host[]): Promise<void> {
    await this.redis.set(HOSTS_KEY, JSON.stringify(hosts));
  }

  private async readOwnCallbacks(): Promise<Callback[]> {
    const payload = await this.redis.get(CALLBACKS_KEY);
    if (!payload) {
      return [];
    }

    return JSON.parse(payload) as Callback[];
  }

  private async writeOwnCallbacks(callbacks: Callback[]): Promise<void> {
    await this.redis.set(CALLBACKS_KEY, JSON.stringify(callbacks));
  }

  private normalizePrefix(prefix: string): string {
    if (!prefix) {
      return "";
    }

    return prefix.endsWith(":") ? prefix : `${prefix}:`;
  }

  private serializeFlag(
    value: string,
    source: FlagSource,
  ): Record<string, string> {
    return {
      value,
      [this.updatedAtField(source)]: new Date().toISOString(),
    };
  }

  private deserializeFlag(
    key: string,
    payload: RedisFlagFields,
  ): StoreFlag | null {
    if (typeof payload.value === "undefined") {
      return null;
    }

    return {
      key,
      value: payload.value,
      mockUpdatedAt: payload.mockUpdatedAt,
      controlUpdatedAt: payload.controlUpdatedAt,
      sdkUpdatedAt: payload.sdkUpdatedAt,
    };
  }

  private updatedAtField(
    source: FlagSource,
  ): "mockUpdatedAt" | "controlUpdatedAt" | "sdkUpdatedAt" {
    switch (source) {
      case "MOCK":
        return "mockUpdatedAt";
      case "CONTROL":
        return "controlUpdatedAt";
      case "SDK":
        return "sdkUpdatedAt";
    }
  }

  private async findStaleKeys(
    keys: string[],
    thresholdSeconds: number,
  ): Promise<string[]> {
    const pipeline = this.redis.pipeline();
    for (const key of keys) {
      pipeline.object("IDLETIME", key);
    }

    const results = await pipeline.exec();
    const staleKeys: string[] = [];

    results?.forEach(([error, idleSeconds], index) => {
      if (error) {
        throw error;
      }
      if (typeof idleSeconds === "number" && idleSeconds > thresholdSeconds) {
        staleKeys.push(keys[index]);
      }
    });

    return staleKeys;
  }

  private findMatchingFlagKeys(
    keys: string[],
    matches: (key: string) => boolean,
  ): string[] {
    return keys.filter((key) => {
      const relativeKey = this.toRelativeFlagKey(key);
      return relativeKey ? matches(relativeKey) : false;
    });
  }

  private createFlagMatcher(
    mode: MatchingFlagsMode,
    pattern: string,
  ): (key: string) => boolean {
    if (mode === "PREFIX") {
      return (key) => key.startsWith(pattern);
    }
    if (mode === "CONTAINS") {
      return (key) => key.includes(pattern);
    }

    const regex = new RegExp(pattern);
    return (key) => regex.test(key);
  }

  private async appendMatchedKeys(
    listKey: string,
    keys: string[],
  ): Promise<void> {
    for (let index = 0; index < keys.length; index += OPERATIONS_BATCH_SIZE) {
      await this.redis.rpush(
        listKey,
        ...keys.slice(index, index + OPERATIONS_BATCH_SIZE),
      );
    }
  }

  private async ensureManagementSentinel(): Promise<void> {
    const idleSeconds = await this.getIdleSeconds(
      `${this.redisPrefix}${MANAGEMENT_SENTINEL_KEY}`,
    );
    if (idleSeconds === null) {
      await this.redis.set(MANAGEMENT_SENTINEL_KEY, "1");
    }
  }

  private async getIdleSeconds(key: string): Promise<number | null> {
    const result = await this.redis.object("IDLETIME", key);
    return typeof result === "number" ? result : null;
  }

  private operationKey(id: string): string {
    return `${MANAGEMENT_OPERATIONS_PREFIX}${id}`;
  }

  private managementFlagKeysKey(id: string): string {
    return `${MANAGEMENT_FLAG_KEYS_PREFIX}${id}`;
  }

  private toRelativeFlagKey(key: string): string | null {
    const flagPrefix = `${this.redisPrefix}${FLAG_PREFIX}`;
    if (!key.startsWith(flagPrefix)) {
      return null;
    }

    return key.slice(flagPrefix.length);
  }

  private toRelativeRedisKey(key: string): string | null {
    if (!key.startsWith(this.redisPrefix)) {
      return null;
    }

    return key.slice(this.redisPrefix.length);
  }

  private serializeOperation(op: Operation): Record<string, string> {
    const data: Record<string, string> = {
      id: op.id,
      type: op.type,
      status: op.status,
      createdAt: op.createdAt,
      ...(op.completedAt ? { completedAt: op.completedAt } : {}),
    };

    switch (op.type) {
      case "STALE_FLAGS":
        return {
          ...data,
          ...this.serializeOperationData("staleFlagsData", op.staleFlagsData),
        };
      case "MATCHING_FLAGS":
        return {
          ...data,
          ...this.serializeOperationData(
            "matchingFlagsData",
            op.matchingFlagsData,
          ),
        };
      case "V1_MIGRATION":
        return {
          ...data,
          ...this.serializeOperationData("v1MigrationData", op.v1MigrationData),
        };
      case "V1_PURGE":
        return {
          ...data,
          ...this.serializeOperationData("v1PurgeData", op.v1PurgeData),
        };
    }
  }

  private serializeOperationUpdate(
    fields: OperationUpdate,
  ): Record<string, string> {
    const payload: Record<string, string> = {};
    if (fields.id !== undefined) payload.id = fields.id;
    if (fields.type !== undefined) payload.type = fields.type;
    if (fields.status !== undefined) payload.status = fields.status;
    if (fields.createdAt !== undefined) payload.createdAt = fields.createdAt;
    if (fields.completedAt !== undefined) {
      payload.completedAt = fields.completedAt;
    }

    return {
      ...payload,
      ...this.serializeOperationData(
        "staleFlagsData",
        fields.staleFlagsData ?? {},
      ),
      ...this.serializeOperationData(
        "matchingFlagsData",
        fields.matchingFlagsData ?? {},
      ),
      ...this.serializeOperationData(
        "v1MigrationData",
        fields.v1MigrationData ?? {},
      ),
      ...this.serializeOperationData("v1PurgeData", fields.v1PurgeData ?? {}),
    };
  }

  private serializeOperationData(
    field: string,
    data: Record<string, string | number | undefined>,
  ): Record<string, string> {
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        payload[`${field}.${key}`] = String(value);
      }
    }
    return payload;
  }

  private deserializeOperation(
    payload: Record<string, string>,
  ): Operation | null {
    if (Object.keys(payload).length === 0) {
      return null;
    }

    const baseOperation = {
      id: payload.id,
      status: payload.status as OperationStatus,
      createdAt: payload.createdAt,
      completedAt: payload.completedAt || undefined,
    };

    if (payload.type === "STALE_FLAGS") {
      return {
        ...baseOperation,
        type: "STALE_FLAGS",
        staleFlagsData: {
          thresholdSeconds: this.parseNumber(
            payload["staleFlagsData.thresholdSeconds"],
          ),
          scannedCount: this.parseOptionalNumber(
            payload["staleFlagsData.scannedCount"],
          ),
          staleFlags: this.parseOptionalNumber(
            payload["staleFlagsData.staleFlags"],
          ),
          purgedCount: this.parseOptionalNumber(
            payload["staleFlagsData.purgedCount"],
          ),
        },
      };
    }

    if (payload.type === "MATCHING_FLAGS") {
      return {
        ...baseOperation,
        type: "MATCHING_FLAGS",
        matchingFlagsData: {
          mode: payload["matchingFlagsData.mode"] as MatchingFlagsMode,
          pattern: payload["matchingFlagsData.pattern"] ?? "",
          scannedCount: this.parseOptionalNumber(
            payload["matchingFlagsData.scannedCount"],
          ),
          matchedCount: this.parseOptionalNumber(
            payload["matchingFlagsData.matchedCount"],
          ),
          purgedCount: this.parseOptionalNumber(
            payload["matchingFlagsData.purgedCount"],
          ),
        },
      };
    }

    if (payload.type === "V1_MIGRATION") {
      return {
        ...baseOperation,
        type: "V1_MIGRATION",
        v1MigrationData: {
          sourcePrefix: payload["v1MigrationData.sourcePrefix"] ?? "",
          mocksFound: this.parseOptionalNumber(
            payload["v1MigrationData.mocksFound"],
          ),
          flagsFound: this.parseOptionalNumber(
            payload["v1MigrationData.flagsFound"],
          ),
          mocksMigrated: this.parseOptionalNumber(
            payload["v1MigrationData.mocksMigrated"],
          ),
          flagsMigrated: this.parseOptionalNumber(
            payload["v1MigrationData.flagsMigrated"],
          ),
          flagsSkipped: this.parseOptionalNumber(
            payload["v1MigrationData.flagsSkipped"],
          ),
        },
      };
    }

    if (payload.type === "V1_PURGE") {
      return {
        ...baseOperation,
        type: "V1_PURGE",
        v1PurgeData: {
          sourcePrefix: payload["v1PurgeData.sourcePrefix"] ?? "",
          migrationCompletedAt:
            payload["v1PurgeData.migrationCompletedAt"] || undefined,
          keysFound: this.parseOptionalNumber(payload["v1PurgeData.keysFound"]),
          purgedCount: this.parseOptionalNumber(
            payload["v1PurgeData.purgedCount"],
          ),
        },
      };
    }

    return null;
  }

  private parseNumber(value: string | undefined): number {
    return Number(value ?? 0);
  }

  private parseOptionalNumber(value: string | undefined): number | undefined {
    return value === undefined ? undefined : Number(value);
  }
}

function escapeGlobPattern(value: string): string {
  return value.replace(/[*?[\]\\]/g, "\\$&");
}
