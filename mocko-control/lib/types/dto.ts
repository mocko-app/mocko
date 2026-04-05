import { ZodError } from "zod";
import type {
  HttpMethod,
  Mock,
  MockAnnotation,
  MockResponse,
} from "@/lib/types/mock";

export type ValidationErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};
export type MockFailure = {
  message: string;
  date: string;
};
export type ParsingError = {
  message: string;
  line: number | null;
  column: number | null;
};

export type CreateMockDto = {
  name: string;
  method: HttpMethod;
  path: string;
  response: MockResponse;
};

export type PatchMockDto = {
  name?: string;
  method?: HttpMethod;
  path?: string;
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
    public readonly isEnabled: boolean,
    public readonly annotations: MockAnnotation[],
  ) {}

  static ofMock(mock: Mock): MockDto {
    return new MockDto(
      mock.id,
      mock.name,
      mock.method,
      mock.path,
      mock.isEnabled,
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
    public readonly isEnabled: boolean,
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
      mock.isEnabled,
      [...mock.annotations],
      MockResponseDto.ofResponse(mock.response),
      failure,
    );
  }
}

export class ErrorDto {
  private constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly errors?: ValidationErrors,
    public readonly parsingError?: ParsingError,
  ) {}

  static ofBadRequest(message: string): ErrorDto {
    return new ErrorDto("BAD_REQUEST", message);
  }

  static ofValidationError(error: ZodError): ErrorDto {
    return new ErrorDto(
      "BAD_REQUEST",
      "Request body validation failed",
      error.flatten(),
    );
  }

  static ofMockNotFound(id: string): ErrorDto {
    return new ErrorDto("MOCK_NOT_FOUND", `Mock "${id}" was not found`);
  }

  static ofTemplateParseError(parsingError: ParsingError): ErrorDto {
    return new ErrorDto(
      "TEMPLATE_PARSE_ERROR",
      parsingError.message,
      undefined,
      parsingError,
    );
  }
}
