"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HourglassIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/callout";
import { CallbackDefinitionCard } from "@/components/callbacks/callback-definition-card";
import { FireCallbackDialog } from "@/components/callbacks/fire-callback-dialog";
import { PendingCallbackCard } from "@/components/callbacks/pending-callback-card";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  EmptySearchResult,
  FilteredOutNotice,
} from "@/components/list-filter-states";
import { ListPageHeader } from "@/components/list-page-header";
import { PageSearchInput } from "@/components/page-search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildCallbackListUrl,
  buildCallbackUrl,
  buildNewCallbackUrl,
  parseCallbackListParams,
} from "@/lib/callback/callback-list-url";
import { filterCallbacks } from "@/lib/callback/filter";
import {
  cancelPendingCallback,
  clearPendingCallbacks,
  deleteCallback,
  fireCallback,
  firePendingCallback,
} from "@/lib/frontend/api";
import {
  shouldSkipConfirmation,
  skipConfirmation,
} from "@/lib/frontend/confirmation-preferences";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";
import { useNow } from "@/lib/frontend/hooks/use-now";
import {
  useCallbacks,
  useMocks,
  usePendingCallbacks,
} from "@/lib/frontend/hooks/resources";
import { replaceUrl } from "@/lib/frontend/replace-url";
import { findBySlugPreferringUi, isOverriddenByUi } from "@/lib/utils/slugs";
import type {
  CallbackDto,
  PendingCallbackDto,
} from "@/lib/types/callback-dtos";

const SectionHeader: React.FC<{
  title: string;
  count: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, count, actions }) => {
  return (
    <div className="mb-2.5 mt-7 flex items-center justify-between gap-4 first:mt-0">
      <h2 className="text-sm font-medium text-foreground">
        {title}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {count}
        </span>
      </h2>
      {actions}
    </div>
  );
};

const EMPTY_DEFINITIONS: CallbackDto[] = [];

const CallbacksListSkeleton: React.FC = () => {
  return (
    <div
      className="flex flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-label="Loading callbacks"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-card px-4 py-3.5"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="h-4 w-36 rounded bg-muted animate-pulse" />
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-3 w-52 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-7 w-16 rounded bg-muted animate-pulse shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

const DocsLink: React.FC = () => (
  <a
    href="https://mocko.dev/docs/creating-mocks/callbacks"
    target="_blank"
    rel="noreferrer"
    className="underline underline-offset-2 hover:text-foreground"
  >
    docs
  </a>
);

const CallbacksPage: React.FC = () => {
  useDocumentTitle("Callbacks");
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const { search } = useMemo(
    () => parseCallbackListParams(new URLSearchParams(query)),
    [query],
  );
  const [searchInputValue, setSearchInputValue] = useState(search);
  const now = useNow(1000);
  const {
    data: definitionsData,
    error: definitionsError,
    isLoading: isLoadingDefinitions,
    mutate: mutateDefinitions,
  } = useCallbacks();
  const {
    data: pendingData,
    error: pendingError,
    isLoading: isLoadingPending,
    mutate: mutatePending,
  } = usePendingCallbacks();
  const { data: mocksData } = useMocks();

  const [fireTarget, setFireTarget] = useState<CallbackDto>();
  const [isFiring, setIsFiring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CallbackDto>();
  const [isDeleting, setIsDeleting] = useState(false);

  const definitions = definitionsData ?? EMPTY_DEFINITIONS;
  const pending = pendingData?.pending ?? [];
  const isSupported = pendingData?.isSupported ?? true;
  const isLoading = isLoadingDefinitions || isLoadingPending;
  const error = definitionsError || pendingError;

  useEffect(() => {
    setSearchInputValue(search);
  }, [search]);

  useEffect(() => {
    const canonical = buildCallbackListUrl(search);
    const current = query ? `/callbacks?${query}` : "/callbacks";
    if (canonical !== current) {
      replaceUrl(canonical);
    }
  }, [query, search]);

  const filteredDefinitions = useMemo(
    () => filterCallbacks(definitions, search),
    [definitions, search],
  );
  const isFiltered = search.length > 0;
  const filteredOutCount = definitions.length - filteredDefinitions.length;
  const definitionsNoun = definitions.length === 1 ? "callback" : "callbacks";
  const definitionsCount = isFiltered
    ? `${filteredDefinitions.length} of ${definitions.length} ${definitionsNoun}`
    : `${definitions.length} ${definitionsNoun}`;

  const countsDescription =
    !isSupported || error ? undefined : definitionsData && pendingData ? (
      `${definitionsCount} · ${pending.length} pending`
    ) : isLoading ? (
      <Skeleton className="my-0.5 h-4 w-28" />
    ) : undefined;

  function mockName(mockId: string | undefined): string | undefined {
    if (!mockId) {
      return undefined;
    }

    return mocksData?.find((mock) => mock.id === mockId)?.name;
  }

  function handleSearchChange(value: string) {
    setSearchInputValue(value);
    replaceUrl(buildCallbackListUrl(value));
  }

  function clearSearch() {
    handleSearchChange("");
  }

  function handleEdit(id: string) {
    router.push(buildCallbackUrl(id, search));
  }

  async function handleFireConfirm(definition: CallbackDto, payload: unknown) {
    setIsFiring(true);
    try {
      await fireCallback(definition.id, payload);
      await mutatePending();
      toast.success("Callback fired.");
      setFireTarget(undefined);
    } catch {
      toast.error("Failed to fire callback.");
    } finally {
      setIsFiring(false);
    }
  }

  async function handleFirePending(target: PendingCallbackDto) {
    try {
      await firePendingCallback(target.id);
      await mutatePending();
      toast.success("Callback fired.");
    } catch {
      toast.error("Failed to fire pending callback.");
    }
  }

  async function handleCancelPending(target: PendingCallbackDto) {
    try {
      await cancelPendingCallback(target.id);
      await mutatePending();
      toast.success("Pending callback cancelled.");
    } catch {
      toast.error("Failed to cancel pending callback.");
    }
  }

  async function handleClearPending() {
    try {
      await clearPendingCallbacks();
      await mutatePending();
      toast.success("Pending callbacks cleared.");
    } catch {
      toast.error("Failed to clear pending callbacks.");
    }
  }

  async function deleteSelectedCallback(definition: CallbackDto) {
    setIsDeleting(true);
    try {
      await deleteCallback(definition.id);
      await mutateDefinitions();
      toast.success("Callback deleted.");
    } catch {
      toast.error("Failed to delete callback.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(undefined);
    }
  }

  function handleDelete(definition: CallbackDto) {
    if (shouldSkipConfirmation("callbacks", "delete")) {
      void deleteSelectedCallback(definition);
      return;
    }
    setDeleteTarget(definition);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget || isDeleting) return;
    void deleteSelectedCallback(deleteTarget);
  }

  return (
    <div>
      <ListPageHeader
        title="Callbacks"
        description={countsDescription}
        actions={
          isSupported && (
            <Button
              nativeButton={false}
              render={
                <Link
                  href={buildNewCallbackUrl(search)}
                  aria-label="Add new callback"
                />
              }
            >
              <PlusIcon aria-hidden="true" />
              Add callback
            </Button>
          )
        }
      />

      {error && (
        <div className="mb-4">
          <Callout
            title="Could not fetch callbacks"
            message="Refresh the page or restart Mocko."
          />
        </div>
      )}

      {!error && isLoading && <CallbacksListSkeleton />}

      {!error && !isLoading && !isSupported && (
        <EmptyState title="Your Mocko core doesn't support callbacks">
          <>
            Callbacks let mocks schedule delayed requests to your services,
            simulating webhooks. Upgrade your Mocko core to use them. See{" "}
            <DocsLink />.
          </>
        </EmptyState>
      )}

      {!error &&
        !isLoading &&
        isSupported &&
        definitions.length === 0 &&
        pending.length === 0 && (
          <EmptyState
            title="No callbacks yet"
            actionHref="/callbacks/new"
            actionLabel="Add callback"
          >
            <>
              Callbacks simulate the requests your real integrations send back.
              See <DocsLink />.
            </>
          </EmptyState>
        )}

      {!error &&
        !isLoading &&
        isSupported &&
        (definitions.length > 0 || pending.length > 0) && (
          <>
            <SectionHeader
              title="Pending"
              count={pending.length}
              actions={
                pending.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleClearPending}
                    aria-label="Clear all pending callbacks"
                  >
                    Clear all
                  </Button>
                ) : undefined
              }
            />
            {pending.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-xs text-muted-foreground">
                <HourglassIcon
                  className="size-5 text-muted-foreground opacity-60"
                  aria-hidden="true"
                />
                Nothing pending. Fire a callback below or trigger a mock that
                schedules one.
              </div>
            ) : (
              <div
                className="flex flex-col gap-2"
                role="list"
                aria-label="Pending callbacks"
              >
                {pending.map((item) => (
                  <PendingCallbackCard
                    key={item.id}
                    pending={item}
                    definition={findBySlugPreferringUi(definitions, item.slug)}
                    triggeredByMockName={mockName(item.triggeredByMockId)}
                    now={now}
                    onFire={handleFirePending}
                    onCancel={handleCancelPending}
                  />
                ))}
              </div>
            )}

            <SectionHeader
              title="Definitions"
              count={
                isFiltered
                  ? `${filteredDefinitions.length} / ${definitions.length}`
                  : definitions.length
              }
            />
            {definitions.length > 0 && (
              <PageSearchInput
                className="mb-3"
                value={searchInputValue}
                onChange={handleSearchChange}
                placeholder="Search callbacks…"
                ariaLabel="Search callbacks"
              />
            )}
            {definitions.length > 0 && filteredDefinitions.length === 0 ? (
              <EmptySearchResult
                message="No callbacks match your search."
                clearLabel="Clear search"
                onClear={clearSearch}
              />
            ) : (
              <div
                className="flex flex-col gap-2"
                role="list"
                aria-label="Callback definitions"
              >
                {filteredDefinitions.map((definition) => (
                  <CallbackDefinitionCard
                    key={definition.id}
                    definition={definition}
                    href={buildCallbackUrl(definition.id, search)}
                    canFire={!isOverriddenByUi(definition, definitions)}
                    onFire={setFireTarget}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
            {isFiltered &&
              filteredDefinitions.length > 0 &&
              filteredOutCount > 0 && (
                <FilteredOutNotice
                  count={filteredOutCount}
                  singular="callback"
                  plural="callbacks"
                  clearLabel="Clear search"
                  onClear={clearSearch}
                />
              )}
          </>
        )}

      {fireTarget && (
        <FireCallbackDialog
          definition={fireTarget}
          isFiring={isFiring}
          onFire={handleFireConfirm}
          onClose={() => !isFiring && setFireTarget(undefined)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={true}
          title="Delete callback"
          itemLabel={deleteTarget.slug}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !isDeleting && setDeleteTarget(undefined)}
          onDontAskAgain={() => skipConfirmation("callbacks", "delete")}
        >
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground font-mono">
            {deleteTarget.slug}
          </span>
          ? Mocks triggering this callback will fail until it is recreated.
        </ConfirmDeleteDialog>
      )}
    </div>
  );
};

export default function CallbacksPageWrapper() {
  return (
    <Suspense>
      <CallbacksPage />
    </Suspense>
  );
}
