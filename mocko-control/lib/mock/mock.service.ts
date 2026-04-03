import { HttpResponseError, tryCatch } from "@/lib/http";
import { coreClient } from "@/lib/core/client";
import {
  toDeployDefinition,
  toReadOnlyDetailsMock,
  toReadOnlyMock,
} from "@/lib/mock/mock.mapper";
import { getStore } from "@/lib/store";
import type { Store } from "@/lib/store/store";
import type { MockFailure } from "@/lib/types/dto";
import type { Mock, MockResponse } from "@/lib/types/mock";
import type {
  CreateMockInput,
  PatchMockInput,
} from "@/lib/validation/mock.schema";

export class MockService {
  constructor(private readonly store: Store) {}

  async listMocks(): Promise<Mock[]> {
    const storeMocks = await this.store.listMocks();
    const storeIds = new Set(storeMocks.map((mock) => mock.id));
    const fileMocks = await this.listReadOnlyMocks();

    return [
      ...storeMocks,
      ...fileMocks.filter((mock) => !storeIds.has(mock.id)),
    ];
  }

  async getMock(id: string): Promise<Mock> {
    const mock = await this.store.getMock(id);
    if (mock) {
      return mock;
    }

    const readOnlyMock = await this.getReadOnlyMock(id);
    if (readOnlyMock) {
      return readOnlyMock;
    }

    throw HttpResponseError.mockNotFound(id);
  }

  async createMock(data: CreateMockInput): Promise<Mock> {
    const mock: Mock = {
      id: crypto.randomUUID(),
      name: data.name,
      method: data.method,
      path: data.path,
      response: data.response,
      isEnabled: true,
      annotations: ["TEMPORARY"],
    };

    await this.store.saveMock(mock.id, mock);
    await this.deploy();
    return mock;
  }

  async updateMock(id: string, data: PatchMockInput): Promise<Mock> {
    const currentMock = await this.store.getMock(id);
    if (!currentMock) {
      throw HttpResponseError.mockNotFound(id);
    }

    const mock: Mock = {
      ...currentMock,
      name: data.name ?? currentMock.name,
      method: data.method ?? currentMock.method,
      path: data.path ?? currentMock.path,
      isEnabled: data.isEnabled ?? currentMock.isEnabled,
      response: data.response
        ? this.mergeResponse(currentMock.response, data.response)
        : currentMock.response,
      annotations: [...currentMock.annotations],
    };

    await this.store.saveMock(id, mock);
    await this.deploy();
    return mock;
  }

  async deleteMock(id: string): Promise<void> {
    await this.store.deleteMock(id);
    await this.deploy();
  }

  async health(): Promise<void> {
    await this.store.health();
  }

  async getFailure(id: string): Promise<MockFailure | null> {
    const [coreMock] = await tryCatch(() => coreClient.getCoreMock(id));
    return coreMock?.failure ?? null;
  }

  private mergeResponse(
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

  private async deploy(): Promise<void> {
    const mocks = await this.store.listMocks();
    const deployDefinition = toDeployDefinition(mocks);

    try {
      await coreClient.deploy(deployDefinition);
    } catch (error) {
      console.error("Failed to deploy mocks to mocko-core:", error);
    }
  }

  private async listReadOnlyMocks(): Promise<Mock[]> {
    try {
      const coreMocks = await coreClient.listCoreMocks();
      return coreMocks
        .filter((mock) => mock.source === "FILE")
        .map(toReadOnlyMock);
    } catch {
      return [];
    }
  }

  private async getReadOnlyMock(id: string): Promise<Mock | null> {
    const [coreMock] = await tryCatch(() => coreClient.getCoreMock(id));
    if (!coreMock || coreMock.source !== "FILE") {
      return null;
    }

    return toReadOnlyDetailsMock(coreMock);
  }
}

export const mockService = new MockService(getStore());
