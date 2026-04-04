"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { api, toApiError, type ApiError } from "@/lib/frontend/api";
import type { MockDetailsDto, MockDto } from "@/lib/types/dto";

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
      refreshInterval: 5000,
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
      refreshInterval: 0,
      revalidateOnFocus: false,
      ...options,
    },
  );
}
