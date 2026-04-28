import axios, { AxiosError } from "axios";
import type {
  ErrorDto,
  ParsingError,
  ValidationErrors,
} from "@/lib/types/error-dtos";
import type { FlagDto, FlagListDto, PutFlagDto } from "@/lib/types/flag-dtos";
import type {
  CreateHostDto,
  HostDto,
  PatchHostDto,
} from "@/lib/types/host-dtos";
import type {
  CreateMockDto,
  MockDetailsDto,
  PatchMockDto,
} from "@/lib/types/mock-dtos";
import type { Operation, OperationsResponse } from "@/lib/types/operation";
import { buildFlagListUrl } from "@/lib/flag/flag-list-url";

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

export async function patchMock(
  id: string,
  payload: PatchMockDto,
): Promise<MockDetailsDto> {
  try {
    const response = await api.patch<MockDetailsDto>(
      `/api/mocks/${id}`,
      payload,
    );
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

export async function getHosts(): Promise<HostDto[]> {
  try {
    const response = await api.get<HostDto[]>("/api/hosts");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getHost(slug: string): Promise<HostDto> {
  try {
    const response = await api.get<HostDto>(`/api/hosts/${slug}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createHost(payload: CreateHostDto): Promise<HostDto> {
  try {
    const response = await api.post<HostDto>("/api/hosts", payload);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function patchHost(
  slug: string,
  payload: PatchHostDto,
): Promise<HostDto> {
  try {
    const response = await api.patch<HostDto>(`/api/hosts/${slug}`, payload);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteHost(slug: string): Promise<void> {
  try {
    await api.delete(`/api/hosts/${slug}`);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getFlags(
  prefix?: string,
  search?: string,
): Promise<FlagListDto> {
  try {
    const url = buildFlagListUrl("/api/flags", prefix, search);
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

export async function putFlag(
  key: string,
  payload: PutFlagDto,
): Promise<FlagDto> {
  try {
    const encodedKey = encodeURIComponent(key);
    const response = await api.put<FlagDto>(
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

export async function getOperations(): Promise<OperationsResponse> {
  try {
    const response = await api.get<OperationsResponse>("/api/operations");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createOperation(
  thresholdSeconds: number,
): Promise<Operation> {
  try {
    const response = await api.post<Operation>("/api/operations", {
      type: "STALE_FLAGS",
      staleFlagsData: { thresholdSeconds },
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function executeOperation(id: string): Promise<Operation> {
  try {
    const response = await api.patch<Operation>(`/api/operations/${id}`, {
      status: "EXECUTING",
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteOperation(id: string): Promise<void> {
  try {
    await api.delete(`/api/operations/${id}`);
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
  slug?: string;
  source?: string;
  destination?: string;
  statusCode?: string;
  delay?: string;
};

export function toFormValidationErrors(
  validation: ApiValidationErrors | undefined,
): FormValidationErrors {
  if (!validation) {
    return {};
  }

  const name = firstError(validation.fieldErrors, "name");
  const path = firstError(validation.fieldErrors, "path");
  const slug = firstError(validation.fieldErrors, "slug");
  const source = firstError(validation.fieldErrors, "source");
  const destination = firstError(validation.fieldErrors, "destination");
  const statusCode =
    firstError(validation.fieldErrors, "response.code") ??
    firstError(validation.fieldErrors, "response");
  const delay =
    firstError(validation.fieldErrors, "response.delay") ??
    firstError(validation.fieldErrors, "response");

  return {
    form: validation.formErrors[0],
    name,
    path,
    slug,
    source,
    destination,
    statusCode,
    delay,
  };
}
