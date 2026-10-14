"use client";

import { Suspense } from "react";
import { CallbackForm } from "@/components/callbacks/callback-form";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";

export default function NewCallbackPage() {
  useDocumentTitle("New callback");
  return (
    <Suspense>
      <CallbackForm mode="create" />
    </Suspense>
  );
}
