"use client";

import { Button } from "@/components/ui/button";

export function EmptySearchResult({
  message,
  clearLabel,
  onClear,
}: {
  message: string;
  clearLabel: string;
  onClear: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button variant="ghost" size="sm" onClick={onClear}>
        {clearLabel}
      </Button>
    </div>
  );
}

export function FilteredOutNotice({
  count,
  singular,
  plural,
  clearLabel,
  onClear,
}: {
  count: number;
  singular: string;
  plural: string;
  clearLabel: string;
  onClear: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-lg border border-border/70 bg-card/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">
        {count} more {count === 1 ? `${singular} was` : `${plural} were`}{" "}
        filtered out.
      </p>
      <Button variant="ghost" size="sm" onClick={onClear}>
        {clearLabel}
      </Button>
    </div>
  );
}
