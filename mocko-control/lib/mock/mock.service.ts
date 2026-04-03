import { HttpResponseError } from "@/lib/http";
import { getStore } from "@/lib/store";
import type { Store } from "@/lib/store/store";
import type { Mock, MockResponse } from "@/lib/types/mock";
import type {
  CreateMockInput,
  PatchMockInput,
} from "@/lib/validation/mock.schema";

export class MockService {
  constructor(private readonly store: Store) {}

  async listMocks(): Promise<Mock[]> {
    return this.store.listMocks();
  }

  async getMock(id: string): Promise<Mock> {
    const mock = await this.store.getMock(id);
    if (!mock) {
      throw HttpResponseError.mockNotFound(id);
    }

    return mock;
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
    return mock;
  }

  async updateMock(id: string, data: PatchMockInput): Promise<Mock> {
    const currentMock = await this.getMock(id);
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
    return mock;
  }

  async deleteMock(id: string): Promise<void> {
    await this.store.deleteMock(id);
  }

  async health(): Promise<void> {
    await this.store.health();
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
}

export const mockService = new MockService(getStore());
