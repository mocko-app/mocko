import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ErrorDto } from "@/lib/types/dto";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

export type TryCatchResult<T, E = Error> =
  | [result: T, error: null]
  | [result: null, error: E];

export function tryCatchSync<T, E = Error>(
  callback: () => T,
): TryCatchResult<T, E> {
  try {
    return [callback(), null];
  } catch (error) {
    return [null, error as E];
  }
}

export async function tryCatch<T, E = Error>(
  callback: () => Promise<T>,
): Promise<TryCatchResult<T, E>> {
  try {
    return [await callback(), null];
  } catch (error) {
    return [null, error as E];
  }
}

export class HttpResponseError extends Error {
  private constructor(
    private readonly status: number,
    private readonly body: ErrorDto,
  ) {
    super(body.message);
    this.name = "HttpResponseError";
  }

  static badRequest(message: string): HttpResponseError {
    return new HttpResponseError(400, ErrorDto.ofBadRequest(message));
  }

  static validationError(error: ZodError): HttpResponseError {
    return new HttpResponseError(400, ErrorDto.ofValidationError(error));
  }

  static mockNotFound(id: string): HttpResponseError {
    return new HttpResponseError(404, ErrorDto.ofMockNotFound(id));
  }

  toResponse(): NextResponse {
    return NextResponse.json(this.body, {
      status: this.status,
      headers: NO_STORE_HEADERS,
    });
  }
}

export function jsonResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

export function noContentResponse(status = 204): NextResponse {
  return new NextResponse(null, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpResponseError) {
    return error.toResponse();
  }

  throw error;
}

export async function parseRequestBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  const [payload, parseError] = await tryCatch(() => request.json());
  if (parseError) {
    throw HttpResponseError.badRequest("Request body must be valid JSON");
  }

  const [body, validationError] = tryCatchSync(() => schema.parse(payload));
  if (validationError instanceof ZodError) {
    throw HttpResponseError.validationError(validationError);
  }

  if (validationError) {
    throw validationError;
  }

  return body;
}
