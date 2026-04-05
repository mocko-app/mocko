"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/delete-dialog";
import { MockCard } from "@/components/mock-card";
import { MocksListSkeleton } from "@/components/mocks-list-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteMock, patchMock } from "@/lib/frontend/api";
import { useMocks } from "@/lib/frontend/hooks/resources";
import type { MockDto } from "@/lib/types/dto";

const EMPTY_MOCKS: MockDto[] = [];

const MocksPageHeader: React.FC<{
  totalCount: number;
  activeCount: number;
}> = ({ totalCount, activeCount }) => {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Mocks
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {totalCount} total · {activeCount} active
        </p>
      </div>
      <Button
        nativeButton={false}
        render={<Link href="/mocks/new" aria-label="Create new mock" />}
      >
        <PlusIcon aria-hidden="true" />
        New mock
      </Button>
    </div>
  );
};

const EmptySearchResult: React.FC<{
  search: string;
  onClear: () => void;
}> = ({ search, onClear }) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-muted-foreground text-sm">
        No mocks match &ldquo;{search}&rdquo;
      </p>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
};

const EmptyMocks: React.FC = () => {
  return (
    <div className="px-6 py-12 text-center" role="status">
      <h2 className="text-lg font-medium text-foreground mb-2">No mocks yet</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
        No mocks yet. Create one with the button below, or add an HCL file and
        it will appear here automatically. See{" "}
        <a
          href="https://mocko.dev/docs/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          docs
        </a>
        .
      </p>
      <Button
        size="sm"
        nativeButton={false}
        render={<Link href="/mocks/new" />}
      >
        Create your first mock
      </Button>
    </div>
  );
};

const FilteredOutNotice: React.FC<{
  count: number;
  onClear: () => void;
}> = ({ count, onClear }) => {
  return (
    <div className="mt-3 flex items-center justify-between rounded-lg border border-border/70 bg-card/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">
        {count} more {count === 1 ? "mock was" : "mocks were"} filtered out.
      </p>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
};

const PollErrorBanner: React.FC = () => {
  return (
    <div
      className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2"
      role="status"
      aria-live="polite"
    >
      <p className="text-xs text-amber-400">
        Could not fetch mocks, refresh the page or restart Mocko
      </p>
    </div>
  );
};

const MocksPage: React.FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MockDto>();
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);

  const { data, error, isLoading, mutate } = useMocks();

  const mocks = data ?? EMPTY_MOCKS;
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return mocks.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        m.path.toLowerCase().includes(q) ||
        m.method.toLowerCase().includes(q)
      );
    });
  }, [mocks, search]);

  const filteredOutCount = mocks.length - filtered.length;
  const activeCount = mocks.filter((m) => m.isEnabled).length;

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
      <MocksPageHeader totalCount={mocks.length} activeCount={activeCount} />

      {Boolean(error) && <PollErrorBanner />}

      <div className="relative mb-6">
        <SearchIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#444] pointer-events-none"
          aria-hidden="true"
        />
        <Input
          className="max-w-sm pl-9 bg-muted border-input placeholder:text-[#3a3a3a] focus-visible:ring-1 focus-visible:ring-[#444] focus-visible:border-[#444]"
          placeholder="Search mocks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search mocks"
        />
      </div>

      {isLoading && <MocksListSkeleton />}

      {!isLoading && filtered.length === 0 && search && (
        <EmptySearchResult search={search} onClear={() => setSearch("")} />
      )}

      {!isLoading && filtered.length === 0 && !search && <EmptyMocks />}

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
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleEnabled={handleToggleEnabled}
              />
            ))}
          </div>
          {search && filteredOutCount > 0 && (
            <FilteredOutNotice
              count={filteredOutCount}
              onClear={() => setSearch("")}
            />
          )}
        </>
      )}

      {deleteTarget && (
        <DeleteDialog
          open={true}
          mockName={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(undefined)}
          onDontAskAgain={() => setSkipDeleteConfirm(true)}
        />
      )}
    </div>
  );
};

export default MocksPage;
