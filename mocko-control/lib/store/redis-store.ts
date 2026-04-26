import Redis, { type Redis as RedisClient, type RedisOptions } from "ioredis";
import { toDeployDefinition } from "@/lib/mock/mock.mapper";
import { CoreClient } from "@/lib/store/core-client";
import { Store, type FlagListResult, type StoreFlag } from "@/lib/store/store";
import type { FlagKey } from "@/lib/types/flag";
import type { Host } from "@/lib/types/host";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock } from "@/lib/types/mock";
import type {
  Operation,
  OperationStatus,
  OperationUpdate,
  StaleFlagsData,
} from "@/lib/types/operation";

const WORKSPACE_MOCKS_KEY = "workspace_mocks";
const HOSTS_KEY = "hosts";
const DEPLOYMENT_KEY = "mocks_deployment";
const FLAG_PREFIX = "flags:";
const FAILURE_PREFIX = "mock_failure:";
const RELOAD_CHANNEL = "mocko:deploy";
const MANAGEMENT_OPERATIONS_PREFIX = "management:operations:";
const MANAGEMENT_OPERATIONS_INDEX_KEY = "management:operations:index";
const MANAGEMENT_STALE_FLAG_KEYS_PREFIX = "management:stale-flag-keys:";
const MANAGEMENT_SENTINEL_KEY = "management:sentinel";
const REDIS_SCAN_COUNT = 10_000;
const PROGRESS_UPDATE_INTERVAL_MS = 1_000;
const OPERATIONS_BATCH_SIZE = 1_000;
type GroupCounts = {
  total: number;
  matches: number;
};

export class RedisStore extends Store {
  readonly isManagementSupported = true;

  private readonly redis: RedisClient;

  constructor(
    redisUrl: string | undefined,
    redisOptions: RedisOptions,
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
    };
  }

  async getFlag(key: string): Promise<StoreFlag | null> {
    const value = await this.redis.get(`${FLAG_PREFIX}${key}`);
    if (value === null) {
      return null;
    }

    return { key, value };
  }

  async setFlag(key: string, value: string): Promise<StoreFlag> {
    const normalizedValue = JSON.stringify(JSON.parse(value));
    await this.redis.set(`${FLAG_PREFIX}${key}`, normalizedValue);
    return { key, value: normalizedValue };
  }

  async deleteFlag(key: string): Promise<boolean> {
    const deleted = await this.redis.del(`${FLAG_PREFIX}${key}`);
    return deleted > 0;
  }

  async deploy(): Promise<void> {
    try {
      const mocks = await this.readOwnMocks();
      const hosts = await this.readOwnHosts();
      const deployDefinition = toDeployDefinition(mocks, hosts);
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
      await this.redis.del(this.staleFlagKeysKey(id));
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
      this.staleFlagKeysKey(id),
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
    const listKey = this.staleFlagKeysKey(operationId);

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

      await this.appendStaleKeys(listKey, staleKeys);

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

  async purgeStaleFlagsForManagement(operationId: string): Promise<void> {
    let purgedCount = 0;
    const listKey = this.staleFlagKeysKey(operationId);

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
    await this.updateOperation(operationId, {
      status: "DONE",
      completedAt: new Date().toISOString(),
      staleFlagsData: { purgedCount },
    });
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

  private normalizePrefix(prefix: string): string {
    if (!prefix) {
      return "";
    }

    return prefix.endsWith(":") ? prefix : `${prefix}:`;
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

  private async appendStaleKeys(
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

  private staleFlagKeysKey(id: string): string {
    return `${MANAGEMENT_STALE_FLAG_KEYS_PREFIX}${id}`;
  }

  private toRelativeRedisKey(key: string): string | null {
    if (!key.startsWith(this.redisPrefix)) {
      return null;
    }

    return key.slice(this.redisPrefix.length);
  }

  private serializeOperation(op: Operation): Record<string, string> {
    return {
      id: op.id,
      type: op.type,
      status: op.status,
      createdAt: op.createdAt,
      ...(op.completedAt ? { completedAt: op.completedAt } : {}),
      ...this.serializeStaleFlagsData(op.staleFlagsData),
    };
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
      ...this.serializeStaleFlagsData(fields.staleFlagsData ?? {}),
    };
  }

  private serializeStaleFlagsData(
    data: Partial<StaleFlagsData>,
  ): Record<string, string> {
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        payload[`staleFlagsData.${key}`] = String(value);
      }
    }
    return payload;
  }

  private deserializeOperation(
    payload: Record<string, string>,
  ): Operation | null {
    if (Object.keys(payload).length === 0 || payload.type !== "STALE_FLAGS") {
      return null;
    }

    return {
      id: payload.id,
      type: "STALE_FLAGS",
      status: payload.status as OperationStatus,
      createdAt: payload.createdAt,
      completedAt: payload.completedAt || undefined,
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

  private parseNumber(value: string | undefined): number {
    return Number(value ?? 0);
  }

  private parseOptionalNumber(value: string | undefined): number | undefined {
    return value === undefined ? undefined : Number(value);
  }
}
