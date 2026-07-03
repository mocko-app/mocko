"use client";

import { HostForm } from "@/components/host-form";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";

export default function NewHostPage() {
  useDocumentTitle("New host");
  return <HostForm mode="create" />;
}
