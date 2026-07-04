"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Callout } from "@/components/callout";
import { EmptyState } from "@/components/empty-state";
import { MockForm } from "@/components/mock-form";
import { ApiError } from "@/lib/frontend/api";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";
import { useMock } from "@/lib/frontend/hooks/resources";
import { useMockListParams } from "@/lib/frontend/hooks/use-mock-list-params";
import { buildMockListUrl } from "@/lib/mock/mock-list-url";
import type { MockDetailsDto } from "@/lib/types/mock-dtos";

function SourceMissingState() {
  const { search, labels } = useMockListParams();
  return (
    <div className="mx-auto max-w-2xl">
      <EmptyState
        title="Mock not found"
        actionHref={buildMockListUrl(search, labels)}
        actionLabel="Back to mocks"
      >
        The mock to duplicate does not exist or is no longer available.
      </EmptyState>
    </div>
  );
}

function toDuplicateInitial(source: MockDetailsDto): MockDetailsDto {
  return {
    id: "",
    name: `${source.name} (copy)`,
    method: source.method,
    path: source.path,
    host: source.host,
    filePath: undefined,
    format: source.format,
    isEnabled: true,
    labels: [...source.labels],
    annotations: [],
    response: {
      code: source.response.code,
      delay: source.response.delay,
      body: source.response.body,
      headers: { ...source.response.headers },
    },
    failure: null,
    conflict: null,
  };
}

function NewMockPageInner() {
  useDocumentTitle("New mock");
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? undefined;
  const { data, error, isLoading } = useMock(from, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });

  if (!from) {
    return <MockForm mode="create" />;
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-sm text-muted-foreground">
        Loading mock...
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <SourceMissingState />;
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

  return <MockForm mode="create" initial={toDuplicateInitial(data)} />;
}

export default function NewMockPage() {
  return (
    <Suspense>
      <NewMockPageInner />
    </Suspense>
  );
}
