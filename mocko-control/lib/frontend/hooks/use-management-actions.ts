"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createOperation,
  deleteOperation,
  executeOperation,
} from "@/lib/frontend/api";
import type { MatchingFlagsMode } from "@/lib/types/operation";

type UseManagementActionsOptions = {
  onChanged: () => Promise<unknown>;
};

export function useManagementActions({
  onChanged,
}: UseManagementActionsOptions) {
  const [isStarting, setIsStarting] = useState(false);

  async function remove(id: string) {
    try {
      await deleteOperation(id);
      await onChanged();
    } catch (removeError) {
      console.error("Failed to remove operation", removeError);
      toast.error("Failed to remove operation");
    }
  }

  async function purge(id: string) {
    try {
      await executeOperation(id);
      await onChanged();
    } catch (purgeError) {
      console.error("Failed to start purge", purgeError);
      toast.error("Failed to start purge");
    }
  }

  async function startStaleFlags(thresholdSeconds: number): Promise<boolean> {
    setIsStarting(true);
    try {
      await createOperation({
        type: "STALE_FLAGS",
        staleFlagsData: { thresholdSeconds },
      });
      await onChanged();
      return true;
    } catch (startError) {
      console.error("Failed to start operation", startError);
      toast.error("Failed to start operation");
      return false;
    } finally {
      setIsStarting(false);
    }
  }

  async function startMatchingFlags(
    mode: MatchingFlagsMode,
    pattern: string,
  ): Promise<boolean> {
    setIsStarting(true);
    try {
      await createOperation({
        type: "MATCHING_FLAGS",
        matchingFlagsData: { mode, pattern },
      });
      await onChanged();
      return true;
    } catch (startError) {
      console.error("Failed to start operation", startError);
      toast.error("Failed to start operation");
      return false;
    } finally {
      setIsStarting(false);
    }
  }

  return {
    isStarting,
    remove,
    purge,
    startStaleFlags,
    startMatchingFlags,
  };
}
