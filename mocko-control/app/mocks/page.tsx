"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/callout";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { LabelFilterBar } from "@/components/label-filter-bar";
import { ListPageHeader } from "@/components/list-page-header";
import { MockCard } from "@/components/mock-card";
import {
  EmptyMocks,
  EmptySearchResult,
  FilteredOutNotice,
} from "@/components/mocks-empty-states";
import {
  LabelBarSkeleton,
  MocksListSkeleton,
} from "@/components/mocks-list-skeleton";
import { PageSearchInput } from "@/components/page-search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteMock, patchMock } from "@/lib/frontend/api";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";
import { useHosts, useMocks } from "@/lib/frontend/hooks/resources";
import { replaceUrl } from "@/lib/frontend/replace-url";
import { filterMocks, getLabelFilterKeys } from "@/lib/mock/filter";
import { formatMockListCounts } from "@/lib/mock/mock-list-counts";
import {
  buildMockListUrl,
  parseMockListParams,
} from "@/lib/mock/mock-list-url";
import type { MockDto } from "@/lib/types/mock-dtos";

const EMPTY_MOCKS: MockDto[] = [];

const MocksPage: React.FC = () => {
  useDocumentTitle("Mocks");
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const { search, labels: selectedLabels } = useMemo(
    () => parseMockListParams(new URLSearchParams(query)),
    [query],
  );
  const [searchInputValue, setSearchInputValue] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState<MockDto>();
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);

  const { data, error, isLoading, mutate } = useMocks();
  const { data: hosts = [] } = useHosts();

  const mocks = data ?? EMPTY_MOCKS;
  const hostSlugs = useMemo(() => hosts.map((host) => host.slug), [hosts]);

  useEffect(() => {
    setSearchInputValue(search);
  }, [search]);

  useEffect(() => {
    const canonical = buildMockListUrl(search, selectedLabels);
    const current = query ? `/mocks?${query}` : "/mocks";
    if (canonical !== current) {
      replaceUrl(canonical);
    }
  }, [query, search, selectedLabels]);

  const filtered = useMemo(
    () => filterMocks(mocks, search, selectedLabels),
    [mocks, search, selectedLabels],
  );
  const labelKeys = useMemo(
    () => getLabelFilterKeys(mocks, filtered, selectedLabels),
    [mocks, filtered, selectedLabels],
  );

  const isFiltered = search.length > 0 || selectedLabels.length > 0;
  const filteredOutCount = mocks.length - filtered.length;
  const disabledCount = mocks.filter((m) => !m.isEnabled).length;
  const countsDescription = data ? (
    formatMockListCounts(
      mocks.length,
      disabledCount,
      isFiltered ? filtered.length : undefined,
    )
  ) : isLoading ? (
    <Skeleton className="my-0.5 h-4 w-36" />
  ) : undefined;

  function handleSearchChange(value: string) {
    setSearchInputValue(value);
    replaceUrl(buildMockListUrl(value, selectedLabels));
  }

  function handleLabelsChange(labels: string[]) {
    replaceUrl(buildMockListUrl(search, labels));
  }

  function clearFilters() {
    setSearchInputValue("");
    replaceUrl("/mocks");
  }

  function handleEdit(id: string) {
    router.push(`/mocks/${id}`);
  }

  function handleDuplicate(id: string) {
    router.push(`/mocks/new?from=${encodeURIComponent(id)}`);
  }

  async function handleDelete(mock: MockDto) {
    if (skipDeleteConfirm) {
      try {
        await deleteMock(mock.id);
        await mutate();
        toast.success("Mock deleted.");
      } catch (error) {
        console.error("Failed to delete mock", error);
        toast.error("Failed to delete mock");
      }
      return;
    }

    setDeleteTarget(mock);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteMock(deleteTarget.id);
      await mutate();
      setDeleteTarget(undefined);
      toast.success("Mock deleted.");
    } catch (error) {
      console.error("Failed to delete mock", error);
      toast.error("Failed to delete mock");
    }
  }

  async function handleToggleEnabled(id: string, enabled: boolean) {
    try {
      await patchMock(id, { isEnabled: enabled });
      await mutate();
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
    <div>
      <ListPageHeader
        title="Mocks"
        description={countsDescription}
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/mocks/new" aria-label="Create new mock" />}
          >
            <PlusIcon aria-hidden="true" />
            New mock
          </Button>
        }
      />

      {Boolean(error) && (
        <div className="mb-4">
          <Callout
            title="Could not fetch mocks"
            message="Refresh the page or restart Mocko."
          />
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        <PageSearchInput
          value={searchInputValue}
          onChange={handleSearchChange}
          placeholder="Search mocks…"
          ariaLabel="Search mocks"
        />
        {isLoading ? (
          <LabelBarSkeleton />
        ) : (
          <LabelFilterBar
            labelKeys={labelKeys}
            selectedLabels={selectedLabels}
            onChange={handleLabelsChange}
          />
        )}
      </div>

      {isLoading && <MocksListSkeleton />}

      {!isLoading && filtered.length === 0 && isFiltered && (
        <EmptySearchResult onClear={clearFilters} />
      )}

      {!isLoading && filtered.length === 0 && !isFiltered && <EmptyMocks />}

      {!isLoading && filtered.length > 0 && (
        <>
          <div
            className="flex flex-col gap-2"
            role="list"
            aria-label="Mocks list"
          >
            {filtered.map((mock) => (
              <MockCard
                key={mock.id}
                mock={mock}
                hostSlugs={hostSlugs}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggleEnabled={handleToggleEnabled}
              />
            ))}
          </div>
          {isFiltered && filteredOutCount > 0 && (
            <FilteredOutNotice
              count={filteredOutCount}
              onClear={clearFilters}
            />
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={true}
          title="Delete mock"
          itemLabel={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(undefined)}
          onDontAskAgain={() => setSkipDeleteConfirm(true)}
        >
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">
            {deleteTarget.name}
          </span>
          ? This action cannot be undone.
        </ConfirmDeleteDialog>
      )}
    </div>
  );
};

export default function MocksPageWrapper() {
  return (
    <Suspense>
      <MocksPage />
    </Suspense>
  );
}
