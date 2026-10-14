"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Callout } from "@/components/callout";
import { CallbackFormSkeleton } from "@/components/detail-form-skeleton";
import { CallbackForm } from "@/components/callbacks/callback-form";
import { FireCallbackDialog } from "@/components/callbacks/fire-callback-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { buildCallbackListUrl } from "@/lib/callback/callback-list-url";
import { ApiError, deleteCallback, fireCallback } from "@/lib/frontend/api";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";
import { useCallbackDefinition } from "@/lib/frontend/hooks/resources";
import { useCallbackListParams } from "@/lib/frontend/hooks/use-callback-list-params";
import { useParam } from "@/lib/frontend/hooks/use-param";
import type { CallbackDto } from "@/lib/types/callback-dtos";
import { fileTakesOverOnDelete } from "@/lib/utils/slugs";

function CallbackDetailPageInner() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const listParams = useCallbackListParams();
  const id = useParam("id");
  const { data: callback, error, isLoading } = useCallbackDefinition(id);
  const [isFireOpen, setIsFireOpen] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  useDocumentTitle(callback ? `Edit: ${callback.slug}` : "Edit callback");

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

  async function handleFireConfirm(definition: CallbackDto, payload: unknown) {
    setIsFiring(true);
    try {
      await fireCallback(definition.id, payload);
      await mutate("/api/callbacks/pending");
      toast.success("Callback fired.");
      setIsFireOpen(false);
    } catch {
      toast.error("Failed to fire callback.");
    } finally {
      setIsFiring(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!callback) {
      return;
    }

    try {
      await deleteCallback(callback.id);
      await mutate("/api/callbacks");
      toast.success("Callback deleted.");
      router.push(buildCallbackListUrl(listParams.search));
    } catch {
      toast.error("Failed to delete callback.");
    }
  }

  return (
    <>
      <CallbackForm
        initial={callback}
        mode="edit"
        onFire={() => setIsFireOpen(true)}
        onDelete={() => setIsConfirmingDelete(true)}
      />
      {isFireOpen && (
        <FireCallbackDialog
          definition={callback}
          isFiring={isFiring}
          onFire={handleFireConfirm}
          onClose={() => !isFiring && setIsFireOpen(false)}
        />
      )}
      {isConfirmingDelete && (
        <ConfirmDeleteDialog
          open={true}
          title="Delete callback"
          itemLabel={callback.slug}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsConfirmingDelete(false)}
          onDontAskAgain={() => {}}
          showDontAskAgain={false}
        >
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground font-mono">
            {callback.slug}
          </span>
          ?{" "}
          {fileTakesOverOnDelete(
            callback.conflict?.related.map((item) => item.origin) ?? [],
          )
            ? "The file callback with the same slug takes over again."
            : "Mocks triggering this callback will fail until it is recreated."}
        </ConfirmDeleteDialog>
      )}
    </>
  );
}

export default function CallbackDetailPage() {
  return (
    <Suspense>
      <CallbackDetailPageInner />
    </Suspense>
  );
}
