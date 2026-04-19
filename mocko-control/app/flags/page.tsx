"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/callout";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FlagsListSkeleton } from "@/components/flags-list-skeleton";
import { parsePrefixCrumbs } from "@/components/flags/crumbs";
import {
  EmptyFlags,
  EmptyFolder,
  EmptySearch,
} from "@/components/flags/flags-empty-states";
import { FlagItem, FolderItem } from "@/components/flags/flags-list-items";
import { ListPageHeader } from "@/components/list-page-header";
import { PageSearchInput } from "@/components/page-search-input";
import { deleteFlag } from "@/lib/frontend/api";
import { useFlags } from "@/lib/frontend/hooks/resources";
import type { FlagKeyDto } from "@/lib/types/flag-dtos";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

type DeleteTarget = {
  key: string;
};

const EMPTY_KEYS: FlagKeyDto[] = [];

const FlagsPage: React.FC = () => {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const searchParams = useSearchParams();
  const prefix = searchParams.get("prefix") ?? "";

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>();
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);

  const { data, error, isLoading } = useFlags(prefix);
  const allItems = data?.flagKeys ?? EMPTY_KEYS;
  const isTruncated = data?.isTruncated ?? false;
  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) {
      return allItems;
    }

    return allItems.filter((item) => item.name.toLowerCase().includes(query));
  }, [allItems, search]);

  const crumbs = parsePrefixCrumbs(prefix);
  const linkedCrumbs = crumbs.slice(0, -1);
  const currentCrumb = crumbs.at(-1)!;
  const isRoot = !prefix;
  const newFlagHref = `/flags/new${prefix ? `?prefix=${prefix}` : ""}`;

  async function revalidateFlagCaches() {
    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/flags"),
      undefined,
      { revalidate: true },
    );
  }

  function handleEdit(key: string) {
    router.push(`/flags/${key}`);
  }

  async function handleDelete(flagKey: string) {
    if (skipDeleteConfirm) {
      try {
        await deleteFlag(flagKey);
        await revalidateFlagCaches();
      } catch (deleteError) {
        console.error("Failed to delete flag", deleteError);
        toast.error("Failed to delete flag");
      }
      return;
    }

    setDeleteTarget({ key: flagKey });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteFlag(deleteTarget.key);
      await revalidateFlagCaches();
      setDeleteTarget(undefined);
    } catch (deleteError) {
      console.error("Failed to delete flag", deleteError);
      toast.error("Failed to delete flag");
    }
  }

  return (
    <div>
      {!isRoot && (
        <Breadcrumb className="mb-5">
          <BreadcrumbList>
            {linkedCrumbs.map((crumb, index) => (
              <React.Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.href !== undefined ? (
                    <BreadcrumbLink render={<Link href={crumb.href} />}>
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentCrumb.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <ListPageHeader
        title={isRoot ? "Flags" : currentCrumb.label}
        description={isRoot ? undefined : prefix}
        titleClassName={isRoot ? undefined : "font-mono"}
        descriptionClassName={isRoot ? undefined : "font-mono"}
        actions={
          <Button
            nativeButton={false}
            render={<Link href={newFlagHref} aria-label="Create new flag" />}
          >
            <PlusIcon aria-hidden="true" />
            New flag
          </Button>
        }
      />

      {Boolean(error) && (
        <div className="mb-4">
          <Callout
            title="Could not fetch flags"
            message="Refresh the page or restart Mocko."
          />
        </div>
      )}

      <PageSearchInput
        className="mb-6"
        value={search}
        onChange={setSearch}
        placeholder="Search..."
        ariaLabel="Search flags and folders"
      />

      {isLoading && <FlagsListSkeleton />}

      {!isLoading && search && filtered.length === 0 && (
        <EmptySearch search={search} onClear={() => setSearch("")} />
      )}

      {!isLoading &&
        !search &&
        allItems.length === 0 &&
        (isRoot ? <EmptyFlags /> : <EmptyFolder />)}

      {!isLoading && filtered.length > 0 && (
        <>
          {isTruncated && (
            <div className="mb-5">
              <Callout
                title="Flag list is truncated"
                message="Only part of this prefix is shown. Narrow your prefix to inspect more keys."
              />
            </div>
          )}
          <div
            className="flex flex-col gap-2"
            role="list"
            aria-label="Flags and folders"
          >
            {filtered.map((item) =>
              item.type === "PREFIX" ? (
                <FolderItem
                  key={`${prefix}${item.name}:`}
                  item={item}
                  prefix={`${prefix}${item.name}:`}
                />
              ) : (
                <FlagItem
                  key={`${prefix}${item.name}`}
                  item={item}
                  flagKey={`${prefix}${item.name}`}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ),
            )}
          </div>
        </>
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={true}
          title="Delete flag"
          itemLabel={deleteTarget.key}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(undefined)}
          onDontAskAgain={() => setSkipDeleteConfirm(true)}
        >
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground font-mono">
            {deleteTarget.key}
          </span>
          ? This action cannot be undone.
        </ConfirmDeleteDialog>
      )}
    </div>
  );
};

export default function FlagsPageWrapper() {
  return (
    <Suspense>
      <FlagsPage />
    </Suspense>
  );
}
