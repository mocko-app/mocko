"use client";

import { Callout } from "@/components/callout";
import { EmptyState } from "@/components/empty-state";
import { MockForm } from "@/components/mock-form";
import { ApiError } from "@/lib/frontend/api";
import { useMock } from "@/lib/frontend/hooks/resources";
import { useParam } from "@/lib/frontend/hooks/use-param";

function EditMissingState() {
  return (
    <div className="mx-auto max-w-2xl">
      <EmptyState
        title="Mock not found"
        actionHref="/mocks"
        actionLabel="Back to mocks"
      >
        This mock does not exist or is no longer available.
      </EmptyState>
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
        <Callout
          title="Could not load mock"
          message="Refresh the page or restart Mocko."
        />
      </div>
    );
  }

  return <MockForm mode="edit" initial={data} />;
}
