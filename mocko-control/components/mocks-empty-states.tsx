"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    <div className="px-6 py-12 text-center" role="status">
      <h2 className="text-lg font-medium text-foreground mb-2">No mocks yet</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
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
      </p>
      <Button
        size="sm"
        nativeButton={false}
        render={<Link href="/mocks/new" />}
      >
        Create your first mock
      </Button>
    </div>
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

export function PollErrorBanner() {
  return (
    <div
      className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2"
      role="status"
      aria-live="polite"
    >
      <p className="text-xs text-amber-400">
        Could not fetch mocks, refresh the page or restart Mocko
      </p>
    </div>
  );
}
