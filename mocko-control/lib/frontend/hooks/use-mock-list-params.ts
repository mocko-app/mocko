"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  parseMockListParams,
  type MockListParams,
} from "@/lib/mock/mock-list-url";

export function useMockListParams(): MockListParams {
  const searchParams = useSearchParams();
  return useMemo(() => parseMockListParams(searchParams), [searchParams]);
}
