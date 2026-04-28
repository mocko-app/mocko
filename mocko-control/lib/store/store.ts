import { toReadOnlyDetailsMock, toReadOnlyMock } from "@/lib/mock/mock.mapper";
import { CoreClient } from "@/lib/store/core-client";
import type { FlagKey } from "@/lib/types/flag";
import type { Host } from "@/lib/types/host";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock, MockAnnotation } from "@/lib/types/mock";
import type { Operation, OperationUpdate } from "@/lib/types/operation";

export type StoreFlag = {
  key: string;
  value: string;
};

export type FlagListResult = {
  flagKeys: FlagKey[];
  isTruncated: boolean;
};

export abstract class Store {
  constructor(protected readonly coreClient: CoreClient) {}

  async listMocks(): Promise<Mock[]> {
    return [
      ...(await this.listOwnMocks()),
      ...(await this.listReadOnlyMocks()),
    ];
  }

  async getMock(id: string): Promise<Mock | null> {
    const mock = await this.getOwnMock(id);
    if (mock) {
      return mock;
    }

    return await this.getReadOnlyMock(id);
  }

  async listHosts(): Promise<Host[]> {
    const ownHosts = await this.listOwnHosts();
    const ownSlugs = new Set(ownHosts.map((host) => host.slug));

    return [
      ...ownHosts,
      ...(await this.listReadOnlyHosts()).filter(
        (host) => !ownSlugs.has(host.slug),
      ),
    ];
  }

  async getHost(slug: string): Promise<Host | null> {
    const host = await this.getOwnHost(slug);
    if (host) {
      return host;
    }

    const readOnlyHosts = await this.listReadOnlyHosts();
    return readOnlyHosts.find((item) => item.slug === slug) ?? null;
  }

  abstract deleteMock(id: string): Promise<boolean>;
  abstract clearFailure(mockId: string): Promise<void>;
  abstract listFlags(prefix: string, search?: string): Promise<FlagListResult>;
  abstract getFlag(key: string): Promise<StoreFlag | null>;
  abstract setFlag(key: string, value: string): Promise<StoreFlag>;
  abstract deleteFlag(key: string): Promise<boolean>;
  abstract deleteHost(slug: string): Promise<boolean>;
  abstract deploy(): Promise<void>;
  abstract getFailure(mockId: string): Promise<MockFailure | null>;
  abstract health(): Promise<void>;
  abstract saveMock(mock: Mock): Promise<void>;
  abstract saveHost(host: Host): Promise<void>;
  abstract getCreatedAnnotations(): MockAnnotation[];
  abstract readonly isManagementSupported: boolean;
  abstract createOperation(op: Operation): Promise<void>;
  abstract updateOperation(id: string, fields: OperationUpdate): Promise<void>;
  abstract listOperations(): Promise<Operation[]>;
  abstract getOperation(id: string): Promise<Operation | null>;
  abstract deleteOperation(id: string): Promise<boolean>;
  abstract getSentinelIdleSeconds(): Promise<number | null>;
  abstract scanStaleFlagsForManagement(
    operationId: string,
    thresholdSeconds: number,
  ): Promise<void>;
  abstract purgeStaleFlagsForManagement(operationId: string): Promise<void>;

  protected abstract listOwnMocks(): Promise<Mock[]>;
  protected abstract getOwnMock(id: string): Promise<Mock | null>;
  protected abstract listOwnHosts(): Promise<Host[]>;
  protected abstract getOwnHost(slug: string): Promise<Host | null>;

  protected async listReadOnlyMocks(): Promise<Mock[]> {
    try {
      const coreMocks = await this.coreClient.listCoreMocks();
      return coreMocks
        .filter((mock) => mock.source === "FILE")
        .map(toReadOnlyMock);
    } catch (error) {
      console.error("Failed to fetch file-based mocks from mocko-core:", error);
      return [];
    }
  }

  protected async getReadOnlyMock(id: string): Promise<Mock | null> {
    try {
      const coreMock = await this.coreClient.getCoreMock(id);
      if (!coreMock || coreMock.source !== "FILE") {
        return null;
      }

      return toReadOnlyDetailsMock(coreMock);
    } catch {
      return null;
    }
  }

  protected async listReadOnlyHosts(): Promise<Host[]> {
    try {
      const coreHosts = await this.coreClient.listCoreHosts();
      return coreHosts.map((host) => ({
        slug: host.slug,
        name: host.name,
        source: host.source,
        destination: host.destination,
        annotations: ["READ_ONLY"],
      }));
    } catch (error) {
      console.error("Failed to fetch file-based hosts from mocko-core:", error);
      return [];
    }
  }
}
