"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusIcon, SearchIcon } from "lucide-react";
import { parsePrefixCrumbs } from "@/components/flags/crumbs";
import { FlagDeleteDialog } from "@/components/flags/flag-delete-dialog";
import {
  EmptyFlags,
  EmptyFolder,
  EmptySearch,
} from "@/components/flags/flags-empty-states";
import { FlagItem, FolderItem } from "@/components/flags/flags-list-items";
import {
  HARDCODED_FLAG_VALUES,
  HARDCODED_ITEMS,
} from "@/components/flags/static-data";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DeleteTarget = {
  key: string;
};

const FlagsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefix = searchParams.get("prefix") ?? "";

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>();
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);

  const allItems = useMemo(
    () => HARDCODED_ITEMS[prefix]?.flagKeys ?? [],
    [prefix],
  );
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

  function handleEdit(key: string) {
    router.push(`/flags/${key}`);
  }

  function handleDelete(flagKey: string) {
    if (skipDeleteConfirm) {
      return;
    }
    setDeleteTarget({ key: flagKey });
  }

  function handleDeleteConfirm() {
    setDeleteTarget(undefined);
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

      <div className="flex items-center justify-between mb-5">
        {isRoot ? (
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Flags
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {Object.values(HARDCODED_FLAG_VALUES).length} flags total
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight font-mono">
              {currentCrumb.label}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">
              {prefix}
            </p>
          </div>
        )}
        <Button
          nativeButton={false}
          render={<Link href={newFlagHref} aria-label="Create new flag" />}
        >
          <PlusIcon aria-hidden="true" />
          New flag
        </Button>
      </div>

      <div className="relative mb-6">
        <SearchIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#444] pointer-events-none"
          aria-hidden="true"
        />
        <Input
          className="max-w-sm pl-9 bg-muted border-input placeholder:text-[#3a3a3a] focus-visible:ring-1 focus-visible:ring-[#444] focus-visible:border-[#444]"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search flags and folders"
        />
      </div>

      {search && filtered.length === 0 && (
        <EmptySearch search={search} onClear={() => setSearch("")} />
      )}

      {!search &&
        allItems.length === 0 &&
        (isRoot ? <EmptyFlags /> : <EmptyFolder />)}

      {filtered.length > 0 && (
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
      )}

      {deleteTarget && (
        <FlagDeleteDialog
          open={true}
          flagKey={deleteTarget.key}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(undefined)}
          onDontAskAgain={() => setSkipDeleteConfirm(true)}
        />
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
