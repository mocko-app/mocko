"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  parseCallbackListParams,
  type CallbackListParams,
} from "@/lib/callback/callback-list-url";

export function useCallbackListParams(): CallbackListParams {
  const searchParams = useSearchParams();
  return useMemo(() => parseCallbackListParams(searchParams), [searchParams]);
}
