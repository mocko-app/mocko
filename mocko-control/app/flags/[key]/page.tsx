"use client";

import Link from "next/link";
import { FlagForm } from "@/components/flags/flag-form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/frontend/api";
import { useFlag } from "@/lib/frontend/hooks/resources";
import { useParam } from "@/lib/frontend/hooks/use-param";

function FlagMissingState() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-lg font-semibold text-foreground">Flag not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This flag does not exist or has expired.
      </p>
      <div className="mt-4 flex justify-center">
        <Button nativeButton={false} render={<Link href="/flags" />}>
          Back to flags
        </Button>
      </div>
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
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2">
          <p className="text-xs text-destructive">
            Failed to load this flag. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return <FlagForm mode="view" flagKey={key} initialValue={data.value} />;
}
