"use client";

import { EraserIcon, ImportIcon, SearchIcon, TimerIcon } from "lucide-react";
import { OperationCard } from "@/components/management/operation-card";

type OperationsCatalogProps = {
  disabled: boolean;
  v1MigrationEnabled: boolean;
  v1PurgeAvailable: boolean;
  onStartStaleFlags: () => void;
  onStartMatchingFlags: () => void;
  onStartV1Migration: () => void;
  onStartV1Purge: () => void;
};

export function OperationsCatalog({
  disabled,
  v1MigrationEnabled,
  v1PurgeAvailable,
  onStartStaleFlags,
  onStartMatchingFlags,
  onStartV1Migration,
  onStartV1Purge,
}: OperationsCatalogProps) {
  return (
    <div className="flex flex-col gap-2">
      <OperationCard
        icon={<TimerIcon className="size-5 text-primary" aria-hidden="true" />}
        name="Stale Flags"
        description="Scan and remove flags that have not been read or written within a configurable number of days."
        onStart={onStartStaleFlags}
        disabled={disabled}
        badge="Beta"
      />
      <OperationCard
        icon={<SearchIcon className="size-5 text-primary" aria-hidden="true" />}
        name="Matching Flags"
        description="Scan and remove flags selected by a prefix, substring, or regular expression."
        onStart={onStartMatchingFlags}
        disabled={disabled}
      />
      {v1MigrationEnabled && (
        <OperationCard
          icon={
            <ImportIcon className="size-5 text-primary" aria-hidden="true" />
          }
          name="Migrate from V1"
          description="Copy the mocks and flags of a Mocko V1 installation on this Redis into this workspace."
          onStart={onStartV1Migration}
          disabled={disabled}
        />
      )}
      {v1MigrationEnabled && v1PurgeAvailable && (
        <OperationCard
          icon={
            <EraserIcon className="size-5 text-primary" aria-hidden="true" />
          }
          name="Purge V1 Data"
          description="Delete the old Mocko V1 keys left behind by a completed migration."
          onStart={onStartV1Purge}
          disabled={disabled}
        />
      )}
    </div>
  );
}
