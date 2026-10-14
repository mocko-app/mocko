"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { HostFormSkeleton } from "@/components/detail-form-skeleton";
import { HostForm } from "@/components/host-form";
import { OverrideSourceNotice } from "@/components/override";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";
import { useHost } from "@/lib/frontend/hooks/resources";
import type { HostDetailsDto } from "@/lib/types/host-dtos";

function toOverrideInitial(source: HostDetailsDto): HostDetailsDto {
  return {
    id: "",
    slug: source.slug,
    name: source.name,
    source: source.source,
    destination: source.destination,
    filePath: undefined,
    annotations: [],
    conflict: null,
  };
}

function NewHostPageInner() {
  useDocumentTitle("New host");
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? undefined;
  const { data, error, isLoading } = useHost(from, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });
  const initial = useMemo(() => data && toOverrideInitial(data), [data]);

  if (!from) {
    return <HostForm mode="create" />;
  }

  if (isLoading) {
    return <HostFormSkeleton />;
  }

  if (!initial) {
    return (
      <div className="flex flex-col gap-6">
        <OverrideSourceNotice entity="host" error={error} />
        <HostForm mode="create" />
      </div>
    );
  }

  return <HostForm mode="create" initial={initial} />;
}

export default function NewHostPage() {
  return (
    <Suspense>
      <NewHostPageInner />
    </Suspense>
  );
}
