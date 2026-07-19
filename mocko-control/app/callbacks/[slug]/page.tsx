"use client";

import { Callout } from "@/components/callout";
import { CallbackFormSkeleton } from "@/components/detail-form-skeleton";
import { CallbackForm } from "@/components/callbacks/callback-form";
import { ApiError } from "@/lib/frontend/api";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";
import { useCallbackDefinition } from "@/lib/frontend/hooks/resources";
import { useParam } from "@/lib/frontend/hooks/use-param";

export default function CallbackDetailPage() {
  const slug = useParam("slug");
  const { data: callback, error, isLoading } = useCallbackDefinition(slug);
  useDocumentTitle(slug ? `Edit: ${slug}` : "Edit callback");

  if (isLoading) {
    return <CallbackFormSkeleton />;
  }

  if (error instanceof ApiError && error.code === "CALLBACK_NOT_FOUND") {
    return (
      <Callout
        title="Callback not found"
        message="This callback no longer exists or is unavailable."
      />
    );
  }

  if (error || !callback) {
    return (
      <Callout
        title="Could not load callback"
        message="Refresh the page or restart Mocko."
      />
    );
  }

  return <CallbackForm initial={callback} mode="edit" />;
}
