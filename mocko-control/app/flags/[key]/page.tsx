"use client";

import { Callout } from "@/components/callout";
import { EmptyState } from "@/components/empty-state";
import { FlagForm } from "@/components/flags/flag-form";
import { ApiError } from "@/lib/frontend/api";
import { useFlag } from "@/lib/frontend/hooks/resources";
import { useParam } from "@/lib/frontend/hooks/use-param";

function FlagMissingState() {
  return (
    <div className="mx-auto max-w-2xl">
      <EmptyState
        title="Flag not found"
        actionHref="/flags"
        actionLabel="Back to flags"
      >
        This flag does not exist or has expired.
      </EmptyState>
    </div>
  );
}

export default function FlagDetailPage() {
  const rawKey = useParam("key");
  const key = rawKey ? decodeURIComponent(rawKey) : undefined;
  const { data, error, isLoading } = useFlag(key);

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

  return <FlagForm mode="view" flagKey={key} initialValue={data.value} />;
}
