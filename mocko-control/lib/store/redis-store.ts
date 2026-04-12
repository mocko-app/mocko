import type { Redis as RedisClient } from "ioredis";
import { toDeployDefinition } from "@/lib/mock/mock.mapper";
import { CoreClient } from "@/lib/store/core-client";
import { Store, type FlagListResult, type StoreFlag } from "@/lib/store/store";
import type { FlagKey } from "@/lib/types/flag";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock } from "@/lib/types/mock";

const WORKSPACE_MOCKS_KEY = "workspace_mocks";
const DEPLOYMENT_KEY = "mocks_deployment";
const FLAG_PREFIX = "flags:";
const FAILURE_PREFIX = "mock_failure:";
const RELOAD_CHANNEL = "mocko:deploy";
const REDIS_SCAN_COUNT = 10_000;

export class RedisStore extends Store {
  constructor(
    private readonly redis: RedisClient,
    private readonly redisPrefix: string,
    private readonly flagsListLimit: number,
    coreClient: CoreClient,
  ) {
    super(coreClient);
  }

  protected async listOwnMocks(): Promise<Mock[]> {
    return this.readOwnMocks();
  }

  protected async getOwnMock(id: string): Promise<Mock | null> {
    const mocks = await this.readOwnMocks();
    return mocks.find((mock) => mock.id === id) ?? null;
  }

  protected async saveCreatedMock(mock: Mock): Promise<void> {
    const mocks = await this.readOwnMocks();
    mocks.push(mock);
    await this.writeOwnMocks(mocks);
  }

  protected async saveUpdatedMock(id: string, mock: Mock): Promise<void> {
    const mocks = await this.readOwnMocks();
    const index = mocks.findIndex((item) => item.id === id);
    mocks[index] = mock;
    await this.writeOwnMocks(mocks);
  }

  protected getCreatedAnnotations(): [] {
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

  async listFlags(prefix: string): Promise<FlagListResult> {
    const normalizedPrefix = this.normalizePrefix(prefix);
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
        if (groups.size + flags.length >= this.flagsListLimit) {
          isTruncated = true;
          cursor = "0";
          break;
        }

        const relativeKey = key
          .replace(`${this.redisPrefix}${FLAG_PREFIX}`, "")
          .slice(normalizedPrefix.length);

        if (!relativeKey) {
          continue;
        }

        if (relativeKey.includes(":")) {
          groups.add(relativeKey.split(":")[0]);
          continue;
        }

        flags.push(relativeKey);
      }
    } while (cursor !== "0");

    return {
      flagKeys: [
        ...Array.from(groups).map<FlagKey>((name) => ({
          type: "PREFIX",
          name,
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
      const deployDefinition = toDeployDefinition(await this.readOwnMocks());
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

  private normalizePrefix(prefix: string): string {
    if (!prefix) {
      return "";
    }

    return prefix.endsWith(":") ? prefix : `${prefix}:`;
  }
}
