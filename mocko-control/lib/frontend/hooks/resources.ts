"use client";

import useSWR, { type SWRConfiguration } from "swr";
import {
  api,
  getFlag,
  getFlags,
  toApiError,
  type ApiError,
} from "@/lib/frontend/api";
import type { FlagDto, FlagListDto } from "@/lib/types/flag-dtos";
import type { MockDetailsDto, MockDto } from "@/lib/types/mock-dtos";

export function useMocks(options?: SWRConfiguration<MockDto[], ApiError>) {
  return useSWR<MockDto[], ApiError>(
    "/api/mocks",
    async () => {
      try {
        const response = await api.get<MockDto[]>("/api/mocks");
        return response.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    {
      refreshInterval: 10_000,
      revalidateOnFocus: true,
      ...options,
    },
  );
}

export function useMock(
  id: string | undefined,
  options?: SWRConfiguration<MockDetailsDto, ApiError>,
) {
  return useSWR<MockDetailsDto, ApiError>(
    id ? `/api/mocks/${id}` : null,
    async () => {
      try {
        const response = await api.get<MockDetailsDto>(`/api/mocks/${id}`);
        return response.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
    {
      refreshInterval: (mock) =>
        mock?.annotations.includes("READ_ONLY") ? 5000 : 0,
      revalidateOnFocus: false,
      ...options,
    },
  );
}

export function useFlags(
  prefix?: string,
  options?: SWRConfiguration<FlagListDto, ApiError>,
) {
  const resourceKey = prefix
    ? `/api/flags?prefix=${encodeURIComponent(prefix)}`
    : "/api/flags";
  return useSWR<FlagListDto, ApiError>(
    resourceKey,
    async () => getFlags(prefix),
    {
      refreshInterval: 0,
      revalidateOnFocus: true,
      ...options,
    },
  );
}

export function useFlag(
  key: string | undefined,
  options?: SWRConfiguration<FlagDto, ApiError>,
) {
  const resourceKey = key ? `/api/flags/${encodeURIComponent(key)}` : null;
  return useSWR<FlagDto, ApiError>(
    resourceKey,
    async () => {
      if (!key) {
        throw new Error("Flag key is required");
      }
      return getFlag(key);
    },
    {
      refreshInterval: 10_000,
      revalidateOnFocus: true,
      ...options,
    },
  );
}
