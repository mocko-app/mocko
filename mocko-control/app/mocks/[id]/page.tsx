"use client";

import Link from "next/link";
import { MockForm } from "@/components/mock-form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/frontend/api";
import { useMock } from "@/lib/frontend/hooks/resources";
import { useParam } from "@/lib/frontend/hooks/use-param";

function EditMissingState() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-lg font-semibold text-foreground">Mock not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This mock does not exist or is no longer available.
      </p>
      <div className="mt-4 flex justify-center">
        <Button nativeButton={false} render={<Link href="/mocks" />}>
          Back to mocks
        </Button>
      </div>
    </div>
  );
}

export default function EditMockPage() {
  const id = useParam("id");
  const { data, error, isLoading } = useMock(id);

  if (!id) {
    return <EditMissingState />;
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-sm text-muted-foreground">
        Loading mock...
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <EditMissingState />;
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2">
          <p className="text-xs text-destructive">
            Failed to load this mock. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return <MockForm mode="edit" initial={data} />;
}
