"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Callout } from "@/components/callout";
import { EmptyState } from "@/components/empty-state";
import { FlagForm } from "@/components/flags/flag-form";
import { buildFlagListUrl } from "@/lib/flag/flag-list-url";
import { ApiError } from "@/lib/frontend/api";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";
import { useFlag } from "@/lib/frontend/hooks/resources";
import { useParam } from "@/lib/frontend/hooks/use-param";

function FlagMissingState() {
  const searchParams = useSearchParams();
  const listQuery = searchParams.get("q") || undefined;
  return (
    <div className="mx-auto max-w-2xl">
      <EmptyState
        title="Flag not found"
        actionHref={buildFlagListUrl("/flags", undefined, listQuery)}
        actionLabel="Back to flags"
      >
        This flag does not exist or has expired.
      </EmptyState>
    </div>
  );
}

function FlagDetailPageInner() {
  const rawKey = useParam("key");
  const key = rawKey ? decodeURIComponent(rawKey) : undefined;
  const { data, error, isLoading } = useFlag(key);
  useDocumentTitle(key ? `Edit: ${key}` : "Edit flag");

  if (!key) {
    return <FlagMissingState />;
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-sm text-muted-foreground">
        Loading flag...
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <FlagMissingState />;
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <Callout
          title="Could not load flag"
          message="Refresh the page or restart Mocko."
        />
      </div>
    );
  }

  return <FlagForm mode="edit" flagKey={key} serverValue={data.value} />;
}

export default function FlagDetailPage() {
  return (
    <Suspense>
      <FlagDetailPageInner />
    </Suspense>
  );
}
