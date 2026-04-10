import type {
  HttpMethod,
  Mock,
  MockAnnotation,
  MockResponse,
} from "@/lib/types/mock";

export type MockFailure = {
  message: string;
  date: string;
};

export type CreateMockDto = {
  name: string;
  method: HttpMethod;
  path: string;
  labels?: string[];
  response: MockResponse;
};

export type PatchMockDto = {
  name?: string;
  method?: HttpMethod;
  path?: string;
  labels?: string[];
  response?: Partial<MockResponse>;
  isEnabled?: boolean;
};

export class MockResponseDto {
  private constructor(
    public readonly code: number,
    public readonly body: string | undefined,
    public readonly headers: Record<string, string>,
  ) {}

  static ofResponse(response: MockResponse): MockResponseDto {
    return new MockResponseDto(response.code, response.body, {
      ...response.headers,
    });
  }
}

export class MockDto {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly method: Mock["method"],
    public readonly path: string,
    public readonly filePath: string | undefined,
    public readonly isEnabled: boolean,
    public readonly labels: string[],
    public readonly annotations: MockAnnotation[],
  ) {}

  static ofMock(mock: Mock): MockDto {
    return new MockDto(
      mock.id,
      mock.name,
      mock.method,
      mock.path,
      mock.filePath,
      mock.isEnabled,
      [...mock.labels],
      [...mock.annotations],
    );
  }
}

export class MockDetailsDto {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly method: Mock["method"],
    public readonly path: string,
    public readonly filePath: string | undefined,
    public readonly isEnabled: boolean,
    public readonly labels: string[],
    public readonly annotations: MockAnnotation[],
    public readonly response: MockResponseDto,
    public readonly failure: MockFailure | null,
  ) {}

  static ofMock(
    mock: Mock,
    failure: MockFailure | null = null,
  ): MockDetailsDto {
    return new MockDetailsDto(
      mock.id,
      mock.name,
      mock.method,
      mock.path,
      mock.filePath,
      mock.isEnabled,
      [...mock.labels],
      [...mock.annotations],
      MockResponseDto.ofResponse(mock.response),
      failure,
    );
  }
}
