"use client";

import { SearchIcon, TimerIcon } from "lucide-react";
import { OperationCard } from "@/components/management/operation-card";

type OperationsCatalogProps = {
  disabled: boolean;
  onStartStaleFlags: () => void;
  onStartMatchingFlags: () => void;
};

export function OperationsCatalog({
  disabled,
  onStartStaleFlags,
  onStartMatchingFlags,
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
    </div>
  );
}
