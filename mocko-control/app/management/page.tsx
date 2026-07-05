"use client";

import { useState } from "react";
import { ListPageHeader } from "@/components/list-page-header";
import { Callout } from "@/components/callout";
import { MatchingFlagsDialog } from "@/components/management/matching-flags-dialog";
import { OperationsCatalog } from "@/components/management/operations-catalog";
import { RunCard } from "@/components/management/run-card";
import { StaleFlagsDialog } from "@/components/management/stale-flags-dialog";
import { V1MigrationDialog } from "@/components/management/v1-migration-dialog";
import { useManagementActions } from "@/lib/frontend/hooks/use-management-actions";
import { useDocumentTitle } from "@/lib/frontend/hooks/use-document-title";
import { useOperations } from "@/lib/frontend/hooks/resources";

export default function ManagementPage() {
  useDocumentTitle("Management");
  const { data, error, isLoading, mutate } = useOperations();
  const [staleStartOpen, setStaleStartOpen] = useState(false);
  const [matchingStartOpen, setMatchingStartOpen] = useState(false);
  const [v1MigrationStartOpen, setV1MigrationStartOpen] = useState(false);
  const {
    isStarting,
    remove,
    purge,
    startStaleFlags,
    startMatchingFlags,
    startV1Migration,
    startV1Purge,
  } = useManagementActions({
    onChanged: async () => {
      await mutate();
    },
  });

  const managementSupported = data?.managementSupported ?? true;
  const sentinelAgeSeconds = data?.sentinelAgeSeconds ?? null;
  const operations = data?.operations ?? [];
  const v1Migration = data?.v1Migration;
  const v1PurgeAvailable = operations.some(
    (operation) =>
      operation.type === "V1_MIGRATION" && operation.status === "DONE",
  );

  return (
    <div>
      <ListPageHeader title="Management" actions={null} />

      {Boolean(error) && (
        <div className="mb-6">
          <Callout
            title="Could not fetch operations"
            message="Refresh the page or restart Mocko."
          />
        </div>
      )}

      {!managementSupported && (
        <div className="mb-6">
          <Callout
            variant="info"
            title="Not available on storeless mode"
            message="Management operations require a persistent store like Redis."
          />
        </div>
      )}

      <section aria-labelledby="operations-heading" className="mb-8">
        <h2
          id="operations-heading"
          className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          Operations
        </h2>
        <div
          className={
            !managementSupported ? "pointer-events-none opacity-40" : undefined
          }
        >
          <OperationsCatalog
            disabled={!managementSupported}
            v1MigrationEnabled={Boolean(v1Migration)}
            v1PurgeAvailable={v1PurgeAvailable}
            onStartStaleFlags={() => setStaleStartOpen(true)}
            onStartMatchingFlags={() => setMatchingStartOpen(true)}
            onStartV1Migration={() => setV1MigrationStartOpen(true)}
            onStartV1Purge={() => void startV1Purge()}
          />
        </div>
      </section>

      <section aria-labelledby="runs-heading">
        <h2
          id="runs-heading"
          className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          Runs
        </h2>

        {isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading runs...
          </p>
        )}

        {!isLoading && operations.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No runs yet. Start an operation above.
          </p>
        )}

        {!isLoading && operations.length > 0 && (
          <div className="flex flex-col gap-2" role="list">
            {operations.map((operation) => (
              <div key={operation.id} role="listitem">
                <RunCard
                  operation={operation}
                  onRemove={remove}
                  onCancel={remove}
                  onPurge={purge}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <StaleFlagsDialog
        open={staleStartOpen}
        sentinelAgeSeconds={sentinelAgeSeconds}
        isStarting={isStarting}
        onOpenChange={setStaleStartOpen}
        onStart={async (thresholdSeconds) => {
          const started = await startStaleFlags(thresholdSeconds);
          if (started) {
            setStaleStartOpen(false);
          }
        }}
      />

      <MatchingFlagsDialog
        open={matchingStartOpen}
        isStarting={isStarting}
        onOpenChange={setMatchingStartOpen}
        onStart={async (mode, pattern) => {
          const started = await startMatchingFlags(mode, pattern);
          if (started) {
            setMatchingStartOpen(false);
          }
        }}
      />

      {v1Migration && (
        <V1MigrationDialog
          open={v1MigrationStartOpen}
          defaultSourcePrefix={v1Migration.defaultSourcePrefix}
          isStarting={isStarting}
          onOpenChange={setV1MigrationStartOpen}
          onStart={async (sourcePrefix) => {
            const started = await startV1Migration(sourcePrefix);
            if (started) {
              setV1MigrationStartOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}
