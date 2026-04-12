import { toReadOnlyDetailsMock, toReadOnlyMock } from "@/lib/mock/mock.mapper";
import { CoreClient } from "@/lib/store/core-client";
import type { FlagKey } from "@/lib/types/flag";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock, MockResponse } from "@/lib/types/mock";
import type {
  CreateMockInput,
  PatchMockInput,
} from "@/lib/validation/mock.schema";

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

  async createMock(data: CreateMockInput): Promise<Mock> {
    const mock: Mock = {
      id: crypto.randomUUID(),
      name: data.name,
      method: data.method,
      path: data.path,
      response: {
        code: data.response.code,
        body: data.response.body,
        headers: { ...data.response.headers },
      },
      isEnabled: true,
      labels: [...(data.labels ?? [])],
      annotations: ["TEMPORARY"],
    };

    await this.saveCreatedMock(mock);
    return mock;
  }

  async updateMock(id: string, data: PatchMockInput): Promise<Mock | null> {
    const current = await this.getOwnMock(id);
    if (!current) {
      return null;
    }

    const next: Mock = {
      ...current,
      name: data.name ?? current.name,
      method: data.method ?? current.method,
      path: data.path ?? current.path,
      isEnabled: data.isEnabled ?? current.isEnabled,
      labels: data.labels ?? current.labels,
      response: data.response
        ? this.mergeResponse(current.response, data.response)
        : current.response,
      annotations: [...current.annotations],
    };

    await this.saveUpdatedMock(id, next);
    return next;
  }

  abstract deleteMock(id: string): Promise<boolean>;
  abstract listFlags(prefix: string): Promise<FlagListResult>;
  abstract getFlag(key: string): Promise<StoreFlag | null>;
  abstract setFlag(key: string, value: string): Promise<StoreFlag>;
  abstract deleteFlag(key: string): Promise<boolean>;
  abstract deploy(): Promise<void>;
  abstract getFailure(mockId: string): Promise<MockFailure | null>;
  abstract health(): Promise<void>;

  protected abstract listOwnMocks(): Promise<Mock[]>;
  protected abstract getOwnMock(id: string): Promise<Mock | null>;
  protected abstract saveCreatedMock(mock: Mock): Promise<void>;
  protected abstract saveUpdatedMock(id: string, mock: Mock): Promise<void>;

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

  protected mergeResponse(
    currentResponse: MockResponse,
    patchResponse: Partial<MockResponse>,
  ): MockResponse {
    return {
      code: patchResponse.code ?? currentResponse.code,
      body:
        patchResponse.body === undefined
          ? currentResponse.body
          : patchResponse.body,
      headers:
        patchResponse.headers === undefined
          ? { ...currentResponse.headers }
          : { ...patchResponse.headers },
    };
  }
}
