"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { HostCard } from "@/components/host-card";
import { HostDeleteDialog } from "@/components/host-delete-dialog";
import { Button } from "@/components/ui/button";
import { deleteHost } from "@/lib/frontend/api";
import { useHosts } from "@/lib/frontend/hooks/resources";
import type { Host } from "@/lib/types/host";

const EmptyHosts: React.FC = () => {
  return (
    <div className="px-6 py-12 text-center" role="status">
      <h2 className="text-lg font-medium text-foreground mb-2">No hosts yet</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
        Route requests to different upstreams based on the http Host.
      </p>
      <Button
        size="sm"
        nativeButton={false}
        render={<Link href="/hosts/new" />}
      >
        Add host
      </Button>
    </div>
  );
};

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
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Hosts
        </h1>
        <Button
          nativeButton={false}
          render={<Link href="/hosts/new" aria-label="Add new host" />}
        >
          <PlusIcon aria-hidden="true" />
          Add host
        </Button>
      </div>

      {error && (
        <div
          className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2"
          role="status"
          aria-live="polite"
        >
          <p className="text-xs text-amber-400">
            Could not fetch hosts, refresh the page or restart Mocko
          </p>
        </div>
      )}

      {hosts.length === 0 ? (
        <EmptyHosts />
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
        <HostDeleteDialog
          open={true}
          hostSlug={deleteTarget.slug}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !isDeleting && setDeleteTarget(undefined)}
          onDontAskAgain={() => setSkipDeleteConfirm(true)}
        />
      )}
    </div>
  );
};

export default HostsPage;
