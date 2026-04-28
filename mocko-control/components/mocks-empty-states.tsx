"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export function EmptySearchResult({ onClear }: { onClear: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-muted-foreground text-sm">
        No mocks match the current filters.
      </p>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}

export function EmptyMocks() {
  return (
    <EmptyState
      title="No mocks yet"
      actionHref="/mocks/new"
      actionLabel="Create your first mock"
    >
      <>
        No mocks yet. Create one with the button below, or add an HCL file and
        it will appear here automatically. See{" "}
        <a
          href="https://mocko.dev/docs/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          docs
        </a>
        .
      </>
    </EmptyState>
  );
}

export function FilteredOutNotice({
  count,
  onClear,
}: {
  count: number;
  onClear: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-lg border border-border/70 bg-card/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">
        {count} more {count === 1 ? "mock was" : "mocks were"} filtered out.
      </p>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}
