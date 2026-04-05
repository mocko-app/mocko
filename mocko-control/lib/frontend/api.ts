import axios, { AxiosError } from "axios";
import type {
  ErrorDto,
  ParsingError,
  ValidationErrors,
} from "@/lib/types/error-dtos";
import type {
  CreateFlagDto,
  FlagDto,
  FlagListDto,
  PatchFlagDto,
} from "@/lib/types/flag-dtos";
import type { CreateMockDto, PatchMockDto } from "@/lib/types/mock-dtos";

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

export async function getFlags(prefix?: string): Promise<FlagListDto> {
  try {
    const url = prefix
      ? `/api/flags?prefix=${encodeURIComponent(prefix)}`
      : "/api/flags";
    const response = await api.get<FlagListDto>(url);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getFlag(key: string): Promise<FlagDto> {
  try {
    const encodedKey = encodeURIComponent(key);
    const response = await api.get<FlagDto>(`/api/flags/${encodedKey}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createFlag(payload: CreateFlagDto): Promise<FlagDto> {
  try {
    const response = await api.post<FlagDto>("/api/flags", payload);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function patchFlag(
  key: string,
  payload: PatchFlagDto,
): Promise<FlagDto> {
  try {
    const encodedKey = encodeURIComponent(key);
    const response = await api.patch<FlagDto>(
      `/api/flags/${encodedKey}`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteFlag(key: string): Promise<void> {
  try {
    const encodedKey = encodeURIComponent(key);
    await api.delete(`/api/flags/${encodedKey}`);
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
