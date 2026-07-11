import axios, { AxiosError, type AxiosResponse } from "axios";
import type {
  ErrorDto,
  ParsingError,
  ValidationErrors,
} from "@/lib/types/error-dtos";
import type { FlagDto, FlagListDto } from "@/lib/types/flag-dtos";
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
import type {
  MatchingFlagsMode,
  Operation,
  OperationsResponse,
} from "@/lib/types/operation";
import type { VersionsDto } from "@/app/api/versions/route";
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

async function request<T>(call: () => Promise<AxiosResponse<T>>): Promise<T> {
  try {
    return (await call()).data;
  } catch (error) {
    throw toApiError(error);
  }
}

export const getMock = (id: string) =>
  request(() => api.get<MockDetailsDto>(`/api/mocks/${id}`));

export const createMock = (payload: CreateMockDto) =>
  request(() => api.post("/api/mocks", payload));

export const patchMock = (id: string, payload: PatchMockDto) =>
  request(() => api.patch<MockDetailsDto>(`/api/mocks/${id}`, payload));

export const deleteMock = (id: string) =>
  request(() => api.delete<void>(`/api/mocks/${id}`));

export const getHosts = () => request(() => api.get<HostDto[]>("/api/hosts"));

export const getHost = (slug: string) =>
  request(() => api.get<HostDto>(`/api/hosts/${slug}`));

export const createHost = (payload: CreateHostDto) =>
  request(() => api.post<HostDto>("/api/hosts", payload));

export const patchHost = (slug: string, payload: PatchHostDto) =>
  request(() => api.patch<HostDto>(`/api/hosts/${slug}`, payload));

export const deleteHost = (slug: string) =>
  request(() => api.delete<void>(`/api/hosts/${slug}`));

export const getFlags = (prefix?: string, search?: string) =>
  request(() =>
    api.get<FlagListDto>(buildFlagListUrl("/api/flags", prefix, search)),
  );

export const getFlag = (key: string) =>
  request(() => api.get<FlagDto>(`/api/flags/${encodeURIComponent(key)}`));

export const putFlag = (key: string, value: string) =>
  request(() =>
    api.put<FlagDto>(`/api/flags/${encodeURIComponent(key)}`, {
      value,
      source: "CONTROL",
    }),
  );

export const deleteFlag = (key: string) =>
  request(() => api.delete<void>(`/api/flags/${encodeURIComponent(key)}`));

export async function getVersions(): Promise<VersionsDto> {
  const response = await api.get<VersionsDto>("/api/versions");
  return response.data;
}

export const getOperations = () =>
  request(() => api.get<OperationsResponse>("/api/operations"));

export type CreateOperationPayload =
  | {
      type: "STALE_FLAGS";
      staleFlagsData: { thresholdSeconds: number };
    }
  | {
      type: "MATCHING_FLAGS";
      matchingFlagsData: { mode: MatchingFlagsMode; pattern: string };
    }
  | {
      type: "V1_MIGRATION";
      v1MigrationData: { sourcePrefix: string };
    }
  | {
      type: "V1_PURGE";
    };

export const createOperation = (payload: CreateOperationPayload) =>
  request(() => api.post<Operation>("/api/operations", payload));

export const executeOperation = (id: string) =>
  request(() =>
    api.patch<Operation>(`/api/operations/${id}`, { status: "EXECUTING" }),
  );

export const deleteOperation = (id: string) =>
  request(() => api.delete<void>(`/api/operations/${id}`));

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
