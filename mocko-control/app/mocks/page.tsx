"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { deleteMock, patchMock } from "@/lib/frontend/api";
import { useHosts, useMocks } from "@/lib/frontend/hooks/resources";
import { matchesMockSearch } from "@/lib/mock/filter";
import type { MockDto } from "@/lib/types/mock-dtos";
import { getAvailableLabels, UNLABELED_KEY } from "@/lib/utils/labels";

const EMPTY_MOCKS: MockDto[] = [];

const MocksPage: React.FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<MockDto>();
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);

  const { data, error, isLoading, mutate } = useMocks();
  const { data: hosts = [] } = useHosts();

  const mocks = data ?? EMPTY_MOCKS;
  const anyMockHasLabels = mocks.some((m) => m.labels.length > 0);
  const hostSlugs = useMemo(() => hosts.map((host) => host.slug), [hosts]);

  const filtered = useMemo(() => {
    let result = mocks;

    if (search) {
      result = result.filter((mock) => matchesMockSearch(mock, search));
    }

    if (selectedLabels.includes(UNLABELED_KEY)) {
      result = result.filter((m) => m.labels.length === 0);
    } else if (selectedLabels.length > 0) {
      result = result.filter((m) => {
        const normalized = m.labels.map((l) => l.toLowerCase());
        return selectedLabels.every((sel) =>
          normalized.includes(sel.toLowerCase()),
        );
      });
    }

    return result;
  }, [mocks, search, selectedLabels]);

  const visibleLabels = useMemo(() => getAvailableLabels(filtered), [filtered]);
  const showUnlabeled =
    anyMockHasLabels && filtered.some((m) => m.labels.length === 0);

  const isFiltered = search.length > 0 || selectedLabels.length > 0;
  const filteredOutCount = mocks.length - filtered.length;
  const activeCount = mocks.filter((m) => m.isEnabled).length;

  function clearFilters() {
    setSearch("");
    setSelectedLabels([]);
  }

  function handleEdit(id: string) {
    router.push(`/mocks/${id}`);
  }

  async function handleDelete(mock: MockDto) {
    if (skipDeleteConfirm) {
      try {
        await deleteMock(mock.id);
        await mutate();
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
    } catch (error) {
      console.error("Failed to delete mock", error);
      toast.error("Failed to delete mock");
    }
  }

  async function handleToggleEnabled(id: string, enabled: boolean) {
    try {
      await patchMock(id, { isEnabled: enabled });
      await mutate();
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
        description={`${mocks.length} total · ${activeCount} active`}
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
          value={search}
          onChange={setSearch}
          placeholder="Search mocks…"
          ariaLabel="Search mocks"
        />
        {isLoading ? (
          <LabelBarSkeleton />
        ) : (
          <LabelFilterBar
            visibleLabels={visibleLabels}
            hasUnlabeled={showUnlabeled}
            selectedLabels={selectedLabels}
            onChange={setSelectedLabels}
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

export default MocksPage;
