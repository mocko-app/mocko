"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Callout } from "@/components/callout";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { MockForm } from "@/components/mock-form";
import { ApiError, deleteMock, patchMock } from "@/lib/frontend/api";
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
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const id = useParam("id");
  const { data, error, isLoading, mutate: mutateMock } = useMock(id);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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

  async function handleDeleteConfirm() {
    if (!data) {
      return;
    }

    try {
      await deleteMock(data.id);
      await mutate("/api/mocks");
      toast.success("Mock deleted.");
      router.push("/mocks");
    } catch (error) {
      console.error("Failed to delete mock", error);
      toast.error("Failed to delete mock");
    }
  }

  async function handleToggleEnabled(enabled: boolean) {
    if (!data) {
      return;
    }

    try {
      const updatedMock = await patchMock(data.id, { isEnabled: enabled });
      await mutateMock(updatedMock, { revalidate: false });
      await mutate("/api/mocks");
      toast.success(enabled ? "Mock enabled." : "Mock disabled.");
    } catch (error) {
      if (enabled) {
        console.error("Failed to enable mock", error);
        toast.error("Failed to enable mock");
      } else {
        console.error("Failed to disable mock", error);
        toast.error("Failed to disable mock");
      }
    }
  }

  return (
    <>
      <MockForm
        mode="edit"
        initial={data}
        onDelete={() => setIsConfirmingDelete(true)}
        onToggleEnabled={handleToggleEnabled}
      />
      {isConfirmingDelete && (
        <ConfirmDeleteDialog
          open={true}
          title="Delete mock"
          itemLabel={data.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsConfirmingDelete(false)}
          onDontAskAgain={() => {}}
          showDontAskAgain={false}
        >
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{data.name}</span>? This
          action cannot be undone.
        </ConfirmDeleteDialog>
      )}
    </>
  );
}
