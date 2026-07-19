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

  static ofUnprocessableEntity(message: string): ErrorDto {
    return new ErrorDto("UNPROCESSABLE_ENTITY", message);
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

  static ofMockReadOnly(id: string): ErrorDto {
    return new ErrorDto(
      "MOCK_READ_ONLY",
      `Mock "${id}" is read-only and cannot be edited`,
    );
  }

  static ofFlagNotFound(key: string): ErrorDto {
    return new ErrorDto("FLAG_NOT_FOUND", `Flag "${key}" was not found`);
  }

  static ofHostNotFound(slug: string): ErrorDto {
    return new ErrorDto("HOST_NOT_FOUND", `Host "${slug}" was not found`);
  }

  static ofOperationNotFound(id: string): ErrorDto {
    return new ErrorDto(
      "OPERATION_NOT_FOUND",
      `Operation "${id}" was not found`,
    );
  }

  static ofHostSlugConflict(slug: string): ErrorDto {
    return new ErrorDto("HOST_SLUG_CONFLICT", `Host "${slug}" already exists`);
  }

  static ofCallbackNotFound(slug: string): ErrorDto {
    return new ErrorDto(
      "CALLBACK_NOT_FOUND",
      `Callback "${slug}" was not found`,
    );
  }

  static ofCallbackSlugConflict(slug: string): ErrorDto {
    return new ErrorDto(
      "CALLBACK_SLUG_CONFLICT",
      `Callback "${slug}" already exists`,
    );
  }

  static ofCallbackReadOnly(slug: string): ErrorDto {
    return new ErrorDto(
      "CALLBACK_READ_ONLY",
      `Callback "${slug}" is read-only and cannot be edited`,
    );
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
