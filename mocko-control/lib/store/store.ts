import { toReadOnlyDetailsMock, toReadOnlyMock } from "@/lib/mock/mock.mapper";
import { CoreClient } from "@/lib/store/core-client";
import type { Callback, CallbackMethod } from "@/lib/types/callback";
import type { PendingCallbackDto } from "@/lib/types/callback-dtos";
import type { FlagKey, FlagSource } from "@/lib/types/flag";
import type { Host } from "@/lib/types/host";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock, MockAnnotation } from "@/lib/types/mock";
import type {
  MatchingFlagsMode,
  Operation,
  OperationUpdate,
} from "@/lib/types/operation";

export type StoreFlag = {
  key: string;
  value: string;
  mockUpdatedAt?: string;
  controlUpdatedAt?: string;
  sdkUpdatedAt?: string;
};

export type FlagListResult = {
  flagKeys: FlagKey[];
  isTruncated: boolean;
  count?: number;
  matchCount?: number;
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

  async listCallbacks(): Promise<Callback[]> {
    const ownCallbacks = await this.listOwnCallbacks();
    const ownSlugs = new Set(ownCallbacks.map((callback) => callback.slug));

    return [
      ...ownCallbacks,
      ...(await this.listReadOnlyCallbacks()).filter(
        (callback) => !ownSlugs.has(callback.slug),
      ),
    ];
  }

  async getCallback(slug: string): Promise<Callback | null> {
    const callback = await this.getOwnCallback(slug);
    if (callback) {
      return callback;
    }

    const readOnlyCallbacks = await this.listReadOnlyCallbacks();
    return readOnlyCallbacks.find((item) => item.slug === slug) ?? null;
  }

  async listPendingCallbacks(): Promise<PendingCallbackDto[] | null> {
    return this.coreClient.listCorePendingCallbacks();
  }

  async fireCallback(
    slug: string,
    payload: unknown,
    delay?: number,
  ): Promise<PendingCallbackDto> {
    return this.coreClient.fireCoreCallback(slug, payload, delay);
  }

  async firePendingCallback(id: string): Promise<void> {
    await this.coreClient.firePendingCoreCallback(id);
  }

  async cancelPendingCallback(id: string): Promise<void> {
    await this.coreClient.cancelPendingCoreCallback(id);
  }

  async clearPendingCallbacks(): Promise<void> {
    await this.coreClient.clearCorePendingCallbacks();
  }

  async getCoreVersion(): Promise<string | null> {
    return this.coreClient.getCoreVersion();
  }

  async hasOwnMocks(): Promise<boolean> {
    return (await this.listOwnMocks()).length > 0;
  }

  abstract deleteMock(id: string): Promise<boolean>;
  abstract clearFailure(mockId: string): Promise<void>;
  abstract listFlags(prefix: string, search?: string): Promise<FlagListResult>;
  abstract getFlag(key: string): Promise<StoreFlag | null>;
  abstract setFlag(
    key: string,
    value: string,
    source: FlagSource,
  ): Promise<StoreFlag>;
  abstract deleteFlag(key: string): Promise<boolean>;
  abstract deleteHost(slug: string): Promise<boolean>;
  abstract deploy(): Promise<void>;
  abstract getFailure(mockId: string): Promise<MockFailure | null>;
  abstract health(): Promise<void>;
  abstract saveMock(mock: Mock): Promise<void>;
  abstract saveHost(host: Host): Promise<void>;
  abstract saveCallback(callback: Callback): Promise<void>;
  abstract deleteCallback(slug: string): Promise<boolean>;
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
  abstract scanMatchingFlagsForManagement(
    operationId: string,
    mode: MatchingFlagsMode,
    pattern: string,
  ): Promise<void>;
  abstract purgeStaleFlagsForManagement(operationId: string): Promise<void>;
  abstract scanV1MigrationForManagement(
    operationId: string,
    sourcePrefix: string,
  ): Promise<void>;
  abstract executeV1MigrationForManagement(
    operationId: string,
    sourcePrefix: string,
  ): Promise<void>;
  abstract scanV1PurgeForManagement(
    operationId: string,
    sourcePrefix: string,
  ): Promise<void>;
  abstract executeV1PurgeForManagement(
    operationId: string,
    sourcePrefix: string,
  ): Promise<void>;

  protected abstract listOwnMocks(): Promise<Mock[]>;
  protected abstract getOwnMock(id: string): Promise<Mock | null>;
  protected abstract listOwnHosts(): Promise<Host[]>;
  protected abstract getOwnHost(slug: string): Promise<Host | null>;
  protected abstract listOwnCallbacks(): Promise<Callback[]>;
  protected abstract getOwnCallback(slug: string): Promise<Callback | null>;

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

  protected async listReadOnlyCallbacks(): Promise<Callback[]> {
    try {
      const coreCallbacks = await this.coreClient.listCoreCallbacks();
      return coreCallbacks.map((callback) => ({
        slug: callback.slug,
        name: callback.name,
        method: callback.method as CallbackMethod,
        host: callback.host,
        path: callback.path,
        url: callback.url,
        delay: callback.delay,
        headers: { ...callback.headers },
        body: callback.body,
        annotations: ["READ_ONLY"],
      }));
    } catch (error) {
      console.error(
        "Failed to fetch file-based callbacks from mocko-core:",
        error,
      );
      return [];
    }
  }
}
