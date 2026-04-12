import { toDeployDefinition } from "@/lib/mock/mock.mapper";
import { CoreClient } from "@/lib/store/core-client";
import { Store, type FlagListResult, type StoreFlag } from "@/lib/store/store";
import type { FlagKey, FlagType } from "@/lib/types/flag";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock } from "@/lib/types/mock";

export class MemoryStore extends Store {
  private readonly mocks = new Map<string, Mock>();

  constructor(coreClient: CoreClient) {
    super(coreClient);
  }

  protected async listOwnMocks(): Promise<Mock[]> {
    return Array.from(this.mocks.values());
  }

  protected async getOwnMock(id: string): Promise<Mock | null> {
    return this.mocks.get(id) ?? null;
  }

  protected async saveCreatedMock(mock: Mock): Promise<void> {
    this.mocks.set(mock.id, mock);
  }

  protected async saveUpdatedMock(id: string, mock: Mock): Promise<void> {
    this.mocks.set(id, mock);
  }

  async deleteMock(id: string): Promise<boolean> {
    return this.mocks.delete(id);
  }

  async listFlags(prefix: string): Promise<FlagListResult> {
    const list = await this.coreClient.listCoreFlags(prefix);
    return {
      flagKeys: list.flagKeys.map((flagKey) => this.toFlagKey(flagKey)),
      isTruncated: list.isTruncated,
    };
  }

  async getFlag(key: string): Promise<StoreFlag | null> {
    const flag = await this.coreClient.getCoreFlag(key);
    if (!flag) {
      return null;
    }

    return { key, value: flag.value };
  }

  async setFlag(key: string, value: string): Promise<StoreFlag> {
    const flag = await this.coreClient.putCoreFlag(key, { value });
    return { key, value: flag.value };
  }

  async deleteFlag(key: string): Promise<boolean> {
    const flag = await this.coreClient.getCoreFlag(key);
    await this.coreClient.deleteCoreFlag(key);
    return flag !== null;
  }

  async deploy(): Promise<void> {
    try {
      await this.coreClient.deploy(
        toDeployDefinition(Array.from(this.mocks.values())),
      );
    } catch (error) {
      console.error("Failed to deploy mocks to mocko-core:", error);
    }
  }

  async getFailure(mockId: string): Promise<MockFailure | null> {
    void mockId;
    return null;
  }

  async health(): Promise<void> {
    return Promise.resolve();
  }

  private toFlagKey(flagKey: { type: string; name: string }): FlagKey {
    return {
      type: flagKey.type as FlagType,
      name: flagKey.name,
    };
  }
}
