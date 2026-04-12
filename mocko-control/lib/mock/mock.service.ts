import { HttpResponseError } from "@/lib/http";
import { $template } from "bigodon/dist/parser";
import { State } from "pierrejs";
import { getStore } from "@/lib/store";
import type { Store } from "@/lib/store/store";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock, MockResponse } from "@/lib/types/mock";
import type {
  CreateMockInput,
  PatchMockInput,
} from "@/lib/validation/mock.schema";

export class MockService {
  constructor(private readonly store: Store) {}

  async listMocks(): Promise<Mock[]> {
    return await this.store.listMocks();
  }

  async getMock(id: string): Promise<Mock> {
    const mock = await this.store.getMock(id);
    if (mock) {
      return mock;
    }

    throw HttpResponseError.mockNotFound(id);
  }

  async createMock(data: CreateMockInput): Promise<Mock> {
    this.assertTemplateIsValid(data.response.body);

    const mock = await this.store.createMock(data);
    await this.store.deploy();
    return mock;
  }

  async updateMock(id: string, data: PatchMockInput): Promise<Mock> {
    const currentMock = await this.store.getMock(id);
    if (!currentMock) {
      throw HttpResponseError.mockNotFound(id);
    }
    if (currentMock.annotations.includes("READ_ONLY")) {
      throw HttpResponseError.mockReadOnly(id);
    }

    const mock = {
      ...currentMock,
      name: data.name ?? currentMock.name,
      method: data.method ?? currentMock.method,
      path: data.path ?? currentMock.path,
      isEnabled: data.isEnabled ?? currentMock.isEnabled,
      labels: data.labels ?? currentMock.labels,
      response: data.response
        ? this.mergeResponse(currentMock.response, data.response)
        : currentMock.response,
      annotations: [...currentMock.annotations],
    };

    this.assertTemplateIsValid(mock.response.body);

    const updatedMock = await this.store.updateMock(id, data);
    if (!updatedMock) {
      throw HttpResponseError.mockNotFound(id);
    }

    await this.store.deploy();
    return updatedMock;
  }

  async deleteMock(id: string): Promise<void> {
    await this.store.deleteMock(id);
    await this.store.deploy();
  }

  async health(): Promise<void> {
    await this.store.health();
  }

  async getFailure(id: string): Promise<MockFailure | null> {
    return this.store.getFailure(id);
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

  private assertTemplateIsValid(body?: string): void {
    if (!body) {
      return;
    }

    const parseResult = $template.applyTo(State.of(body));
    if (parseResult.error) {
      const { line, column } = this.indexToLineAndColumn(
        body,
        parseResult.state.index,
      );
      throw HttpResponseError.templateParseError({
        message: `Error at line ${line}, column ${column}: ${parseResult.error}`,
        line,
        column,
      });
    }
  }

  private indexToLineAndColumn(
    code: string,
    index: number,
  ): { line: number; column: number } {
    let line = 1;
    let column = 1;

    for (let i = 0; i < index; i += 1) {
      if (code[i] === "\n") {
        line += 1;
        column = 1;
        continue;
      }
      column += 1;
    }

    return { line, column };
  }
}

export const mockService = new MockService(getStore());
