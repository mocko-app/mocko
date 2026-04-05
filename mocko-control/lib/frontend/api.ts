import axios, { AxiosError } from "axios";
import type {
  CreateMockDto,
  ErrorDto,
  ParsingError,
  PatchMockDto,
  ValidationErrors,
} from "@/lib/types/dto";

export type ApiErrorDto = ErrorDto;
export type ApiValidationErrors = ValidationErrors;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorDto | null,
  ) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
  }

  get code(): string | undefined {
    return this.body?.code;
  }

  get validation(): ApiValidationErrors | undefined {
    return this.body?.errors;
  }

  get parsingError(): ParsingError | undefined {
    return this.body?.parsingError;
  }
}

export const api = axios.create();

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 500;
    const body = (error.response?.data as ApiErrorDto | undefined) ?? null;
    return new ApiError(status, body);
  }

  return new ApiError(500, null);
}

export async function createMock(payload: CreateMockDto) {
  try {
    const response = await api.post("/api/mocks", payload);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function patchMock(id: string, payload: PatchMockDto) {
  try {
    const response = await api.patch(`/api/mocks/${id}`, payload);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteMock(id: string): Promise<void> {
  try {
    await api.delete(`/api/mocks/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
}

function firstError(
  fieldErrors: Record<string, string[] | undefined>,
  key: string,
): string | undefined {
  return fieldErrors[key]?.[0];
}

export type FormValidationErrors = {
  form?: string;
  name?: string;
  path?: string;
  statusCode?: string;
};

export function toFormValidationErrors(
  validation: ApiValidationErrors | undefined,
): FormValidationErrors {
  if (!validation) {
    return {};
  }

  const name = firstError(validation.fieldErrors, "name");
  const path = firstError(validation.fieldErrors, "path");
  const statusCode =
    firstError(validation.fieldErrors, "response.code") ??
    firstError(validation.fieldErrors, "response");

  return {
    form: validation.formErrors[0],
    name,
    path,
    statusCode,
  };
}
