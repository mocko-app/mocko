import { toReadOnlyDetailsMock, toReadOnlyMock } from "@/lib/mock/mock.mapper";
import { CoreClient } from "@/lib/store/core-client";
import { withSlugDerivedIds } from "@/lib/store/slug-ids";
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

const FILE_HOST_FALLBACK_NAMESPACE = "1800c9d2-ba7e-4bf8-ab77-1167a06ce568";
const FILE_CALLBACK_FALLBACK_NAMESPACE = "6d4b2f0e-93a1-4c57-b8e2-0f3c71a9d845";

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
    return [
      ...(await this.listOwnHosts()),
      ...(await this.listReadOnlyHosts()),
    ];
  }

  async getHost(id: string): Promise<Host | null> {
    const host = await this.getOwnHost(id);
    if (host) {
      return host;
    }

    const readOnlyHosts = await this.listReadOnlyHosts();
    return readOnlyHosts.find((item) => item.id === id) ?? null;
  }

  async listCallbacks(): Promise<Callback[]> {
    return [
      ...(await this.listOwnCallbacks()),
      ...(await this.listReadOnlyCallbacks()),
    ];
  }

  async getCallback(id: string): Promise<Callback | null> {
    const callback = await this.getOwnCallback(id);
    if (callback) {
      return callback;
    }

    const readOnlyCallbacks = await this.listReadOnlyCallbacks();
    return readOnlyCallbacks.find((item) => item.id === id) ?? null;
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
  abstract deleteHost(id: string): Promise<boolean>;
  abstract deploy(): Promise<void>;
  abstract getFailure(mockId: string): Promise<MockFailure | null>;
  abstract health(): Promise<void>;
  abstract saveMock(mock: Mock): Promise<void>;
  abstract saveHost(host: Host): Promise<void>;
  abstract saveCallback(callback: Callback): Promise<void>;
  abstract deleteCallback(id: string): Promise<boolean>;
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
  protected abstract getOwnHost(id: string): Promise<Host | null>;
  protected abstract listOwnCallbacks(): Promise<Callback[]>;
  protected abstract getOwnCallback(id: string): Promise<Callback | null>;

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
      return withSlugDerivedIds(
        coreHosts.map((host): Omit<Host, "id"> & { id?: string } => ({
          id: host.id,
          slug: host.slug,
          name: host.name,
          source: host.source,
          destination: host.destination,
          filePath: host.filePath,
          annotations: ["READ_ONLY"],
        })),
        FILE_HOST_FALLBACK_NAMESPACE,
      );
    } catch (error) {
      console.error("Failed to fetch file-based hosts from mocko-core:", error);
      return [];
    }
  }

  protected async listReadOnlyCallbacks(): Promise<Callback[]> {
    try {
      const coreCallbacks = await this.coreClient.listCoreCallbacks();
      return withSlugDerivedIds(
        coreCallbacks.map(
          (callback): Omit<Callback, "id"> & { id?: string } => ({
            id: callback.id,
            slug: callback.slug,
            name: callback.name,
            method: callback.method as CallbackMethod,
            host: callback.host,
            path: callback.path,
            url: callback.url,
            delay: callback.delay,
            headers: { ...callback.headers },
            body: callback.body,
            filePath: callback.filePath,
            annotations: ["READ_ONLY"],
          }),
        ),
        FILE_CALLBACK_FALLBACK_NAMESPACE,
      );
    } catch (error) {
      console.error(
        "Failed to fetch file-based callbacks from mocko-core:",
        error,
      );
      return [];
    }
  }
}
