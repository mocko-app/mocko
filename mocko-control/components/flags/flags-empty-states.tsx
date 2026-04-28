"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export function EmptyFlags() {
  return (
    <EmptyState title="No flags yet">
      <>
        Flags are set by mocks using Bigodon templating. See{" "}
        <a
          href="https://mocko.dev/docs/templating/persistence/"
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

export function EmptyFolder() {
  return (
    <div className="px-6 py-12 text-center" role="status">
      <p className="text-sm text-muted-foreground">
        No flags exist for this prefix yet.
      </p>
    </div>
  );
}

export function EmptySearch({
  search,
  onClear,
}: {
  search: string;
  onClear: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-muted-foreground text-sm">
        No items match &ldquo;{search}&rdquo;
      </p>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
}
