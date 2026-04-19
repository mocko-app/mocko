import { HttpResponseError } from "@/lib/http";
import { $template } from "bigodon/dist/parser";
import { State } from "pierrejs";
import { getStore } from "@/lib/store";
import type { Store } from "@/lib/store/store";
import type { MockFailure } from "@/lib/types/mock-dtos";
import type { Mock } from "@/lib/types/mock";
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

    const mock: Mock = {
      id: crypto.randomUUID(),
      name: data.name,
      method: data.method,
      path: data.path,
      host: data.host || undefined,
      format: data.format,
      response: {
        code: data.response.code,
        delay: data.response.delay,
        body: data.response.body,
        headers: { ...data.response.headers },
      },
      isEnabled: true,
      labels: [...(data.labels ?? [])],
      annotations: this.store.getCreatedAnnotations(),
    };
    this.assertFormatDoesNotConflictWithContentType(mock);

    await this.store.saveMock(mock);
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

    let nextHost = currentMock.host;
    if (data.host !== undefined) {
      nextHost = data.host ?? undefined;
    }

    const mock = {
      ...currentMock,
      name: data.name ?? currentMock.name,
      method: data.method ?? currentMock.method,
      path: data.path ?? currentMock.path,
      host: nextHost,
      format: data.format ?? currentMock.format,
      isEnabled: data.isEnabled ?? currentMock.isEnabled,
      labels: data.labels ?? currentMock.labels,
      response: data.response
        ? {
            code: data.response.code,
            delay: data.response.delay,
            body: data.response.body,
            headers: { ...data.response.headers },
          }
        : currentMock.response,
      annotations: [...currentMock.annotations],
    };

    this.assertTemplateIsValid(mock.response.body);
    this.assertFormatDoesNotConflictWithContentType(mock);

    await this.store.saveMock(mock);

    await this.store.deploy();
    await this.store.clearFailure(mock.id);
    return mock;
  }

  async deleteMock(id: string): Promise<void> {
    await this.store.deleteMock(id);
    await this.store.deploy();
    await this.store.clearFailure(id);
  }

  async health(): Promise<void> {
    await this.store.health();
  }

  async getFailure(id: string): Promise<MockFailure | null> {
    return this.store.getFailure(id);
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

  private assertFormatDoesNotConflictWithContentType(mock: Mock): void {
    if (!mock.format) {
      return;
    }

    const hasContentType = Object.keys(mock.response.headers ?? {}).some(
      (key) => key.toLowerCase() === "content-type",
    );
    if (hasContentType) {
      throw HttpResponseError.badRequest(
        "cannot use both 'format' and an explicit Content-Type header",
      );
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
