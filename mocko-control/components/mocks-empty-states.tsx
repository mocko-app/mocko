"use client";

import { EmptyState } from "@/components/empty-state";

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
          href="https://mocko.dev/docs/getting-started"
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
