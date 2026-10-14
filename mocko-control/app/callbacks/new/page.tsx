"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CallbackForm } from "@/components/callbacks/callback-form";
import { CallbackFormSkeleton } from "@/components/detail-form-skeleton";
import { OverrideSourceNotice } from "@/components/override";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";
import { useCallbackDefinition } from "@/lib/frontend/hooks/resources";
import type { CallbackDetailsDto } from "@/lib/types/callback-dtos";

function toOverrideInitial(source: CallbackDetailsDto): CallbackDetailsDto {
  return {
    id: "",
    slug: source.slug,
    name: source.name,
    method: source.method,
    host: source.host,
    path: source.path,
    url: source.url,
    delay: source.delay,
    headers: { ...source.headers },
    body: source.body,
    filePath: undefined,
    annotations: [],
    conflict: null,
  };
}

function NewCallbackPageInner() {
  useDocumentTitle("New callback");
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? undefined;
  const { data, error, isLoading } = useCallbackDefinition(from, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });
  const initial = useMemo(() => data && toOverrideInitial(data), [data]);

  if (!from) {
    return <CallbackForm mode="create" />;
  }

  if (isLoading) {
    return <CallbackFormSkeleton />;
  }

  if (!initial) {
    return (
      <div className="flex flex-col gap-6">
        <OverrideSourceNotice entity="callback" error={error} />
        <CallbackForm mode="create" />
      </div>
    );
  }

  return <CallbackForm mode="create" initial={initial} />;
}

export default function NewCallbackPage() {
  return (
    <Suspense>
      <NewCallbackPageInner />
    </Suspense>
  );
}
