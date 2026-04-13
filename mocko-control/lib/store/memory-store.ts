import { toDeployDefinition } from "@/lib/mock/mock.mapper";
import { CoreClient } from "@/lib/store/core-client";
import { Store, type FlagListResult, type StoreFlag } from "@/lib/store/store";
import type { FlagKey, FlagType } from "@/lib/types/flag";
import type { Host } from "@/lib/types/host";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock } from "@/lib/types/mock";

export class MemoryStore extends Store {
  private readonly mocks = new Map<string, Mock>();
  private readonly hosts = new Map<string, Host>();

  constructor(coreClient: CoreClient) {
    super(coreClient);
  }

  protected async listOwnMocks(): Promise<Mock[]> {
    return Array.from(this.mocks.values());
  }

  protected async getOwnMock(id: string): Promise<Mock | null> {
    return this.mocks.get(id) ?? null;
  }

  async saveMock(mock: Mock): Promise<void> {
    this.mocks.set(mock.id, mock);
  }

  getCreatedAnnotations(): ["TEMPORARY"] {
    return ["TEMPORARY"];
  }

  async deleteMock(id: string): Promise<boolean> {
    return this.mocks.delete(id);
  }

  protected async listOwnHosts(): Promise<Host[]> {
    return Array.from(this.hosts.values());
  }

  protected async getOwnHost(slug: string): Promise<Host | null> {
    return this.hosts.get(slug) ?? null;
  }

  async saveHost(host: Host): Promise<void> {
    this.hosts.set(host.slug, host);
  }

  async deleteHost(slug: string): Promise<boolean> {
    return this.hosts.delete(slug);
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
        toDeployDefinition(
          Array.from(this.mocks.values()),
          Array.from(this.hosts.values()),
        ),
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
