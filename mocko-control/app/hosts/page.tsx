"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/callout";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { HostCard } from "@/components/host-card";
import { ListPageHeader } from "@/components/list-page-header";
import { Button } from "@/components/ui/button";
import { deleteHost } from "@/lib/frontend/api";
import { useHosts } from "@/lib/frontend/hooks/resources";
import type { Host } from "@/lib/types/host";

const HostsPage: React.FC = () => {
  const router = useRouter();
  const { data: hosts = [], error, mutate } = useHosts();
  const [deleteTarget, setDeleteTarget] = useState<Host>();
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleEdit(slug: string) {
    router.push(`/hosts/${slug}`);
  }

  async function deleteSelectedHost(host: Host) {
    setIsDeleting(true);
    try {
      await deleteHost(host.slug);
      await mutate();
      toast.success("Host deleted.");
    } catch {
      toast.error("Failed to delete host.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(undefined);
    }
  }

  function handleDelete(host: Host) {
    if (skipDeleteConfirm) {
      void deleteSelectedHost(host);
      return;
    }
    setDeleteTarget(host);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget || isDeleting) return;
    void deleteSelectedHost(deleteTarget);
  }

  return (
    <div>
      <ListPageHeader
        title="Hosts"
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/hosts/new" aria-label="Add new host" />}
          >
            <PlusIcon aria-hidden="true" />
            Add host
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Callout
            title="Could not fetch hosts"
            message="Refresh the page or restart Mocko."
          />
        </div>
      )}

      {hosts.length === 0 ? (
        <EmptyState
          title="No hosts yet"
          actionHref="/hosts/new"
          actionLabel="Add host"
        >
          Route requests to different upstreams based on the http Host.
        </EmptyState>
      ) : (
        <div
          className="flex flex-col gap-2"
          role="list"
          aria-label="Hosts list"
        >
          {hosts.map((host) => (
            <HostCard
              key={host.slug}
              host={host}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={true}
          title="Delete host"
          itemLabel={deleteTarget.slug}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !isDeleting && setDeleteTarget(undefined)}
          onDontAskAgain={() => setSkipDeleteConfirm(true)}
        >
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground font-mono">
            {deleteTarget.slug}
          </span>
          ? This will remove the host permanently. Mocks referencing this host
          will no longer be scoped.
        </ConfirmDeleteDialog>
      )}
    </div>
  );
};

export default HostsPage;
