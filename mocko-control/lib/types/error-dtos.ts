import { ZodError } from "zod";

export type ValidationErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

export type ParsingError = {
  message: string;
  line: number | null;
  column: number | null;
};

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

  static ofFlagNotFound(key: string): ErrorDto {
    return new ErrorDto("FLAG_NOT_FOUND", `Flag "${key}" was not found`);
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
