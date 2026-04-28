"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FlagForm } from "@/components/flags/flag-form";

function NewFlagPageInner() {
  const searchParams = useSearchParams();
  const prefix = searchParams.get("prefix") ?? undefined;

  return <FlagForm mode="create" prefix={prefix} />;
}

export default function NewFlagPage() {
  return (
    <Suspense>
      <NewFlagPageInner />
    </Suspense>
  );
}
