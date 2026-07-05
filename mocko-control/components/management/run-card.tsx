"use client";

import { useState, type ReactNode } from "react";
import { Loader2Icon, TrashIcon, XIcon } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  MatchingFlagsMode,
  Operation,
  OperationStatus,
} from "@/lib/types/operation";

const SECONDS_PER_DAY = 86_400;
const STUCK_OPERATION_AGE_MS = 5 * 60 * 1000;

type RunCardProps = {
  operation: Operation;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onPurge: (id: string) => void;
};

type OperationRunCardProps<T extends Operation["type"]> = Omit<
  RunCardProps,
  "operation"
> & {
  operation: Extract<Operation, { type: T }>;
};

type OperationRunCardComponent<T extends Operation["type"]> = (
  props: OperationRunCardProps<T>,
) => ReactNode;

type StatusConfig = {
  label: string;
  badgeVariant:
    | "statusInfo"
    | "statusWarning"
    | "statusSuccess"
    | "statusDanger";
  subtitleVerb: "Started" | "Completed" | "Failed";
};

type ExecuteConfirm = {
  title: string;
  itemLabel: string;
  confirmLabel: string;
  message: ReactNode;
};

type OperationRunCardFrameProps = {
  operationId: string;
  title: string;
  criterionSubtitle: string;
  status: OperationStatus;
  createdAt: string;
  completedAt?: string;
  statusContent: ReactNode;
  canExecute: boolean;
  executeLabel: string;
  executeVariant: "default" | "destructive";
  confirm?: ExecuteConfirm;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onExecute: (id: string) => void;
};

const STATUS_CONFIG: Record<OperationStatus, StatusConfig> = {
  SCANNING: {
    label: "Scanning",
    badgeVariant: "statusInfo",
    subtitleVerb: "Started",
  },
  READY: {
    label: "Ready",
    badgeVariant: "statusWarning",
    subtitleVerb: "Started",
  },
  EXECUTING: {
    label: "Executing",
    badgeVariant: "statusInfo",
    subtitleVerb: "Started",
  },
  DONE: {
    label: "Done",
    badgeVariant: "statusSuccess",
    subtitleVerb: "Completed",
  },
  FAILED: {
    label: "Failed",
    badgeVariant: "statusDanger",
    subtitleVerb: "Failed",
  },
};

const RUN_CARD_COMPONENTS = {
  STALE_FLAGS: StaleFlagsRunCard,
  MATCHING_FLAGS: MatchingFlagsRunCard,
  V1_MIGRATION: V1MigrationRunCard,
  V1_PURGE: V1PurgeRunCard,
} satisfies {
  [T in Operation["type"]]: OperationRunCardComponent<T>;
};

export function RunCard(props: RunCardProps) {
  const renderRunCard = RUN_CARD_COMPONENTS[props.operation.type] as (
    props: RunCardProps,
  ) => ReactNode;

  return <>{renderRunCard(props)}</>;
}

function StaleFlagsRunCard({
  operation,
  onRemove,
  onCancel,
  onPurge,
}: OperationRunCardProps<"STALE_FLAGS">) {
  const thresholdDays = Math.round(
    operation.staleFlagsData.thresholdSeconds / SECONDS_PER_DAY,
  );
  const matchedCount = operation.staleFlagsData.staleFlags ?? 0;

  return (
    <OperationRunCardFrame
      operationId={operation.id}
      title="Stale Flags"
      criterionSubtitle={`${thresholdDays}-day threshold`}
      status={operation.status}
      createdAt={operation.createdAt}
      completedAt={operation.completedAt}
      statusContent={
        <FlagsPurgeStatusContent
          status={operation.status}
          scannedCount={operation.staleFlagsData.scannedCount ?? 0}
          matchedCount={matchedCount}
          purgedCount={operation.staleFlagsData.purgedCount ?? 0}
        />
      }
      canExecute={matchedCount > 0}
      executeLabel="Purge"
      executeVariant="destructive"
      confirm={{
        title: "Purge stale flags",
        itemLabel: `${matchedCount.toLocaleString()} stale flags`,
        confirmLabel: `Purge ${matchedCount.toLocaleString()} flags`,
        message: (
          <>
            This will permanently delete{" "}
            <span className="font-medium text-foreground">
              {matchedCount.toLocaleString()}
            </span>{" "}
            flags that have not been read or written in the last{" "}
            <span className="font-medium text-foreground">
              {thresholdDays} days
            </span>
            . This action cannot be undone.
          </>
        ),
      }}
      onRemove={onRemove}
      onCancel={onCancel}
      onExecute={onPurge}
    />
  );
}

function MatchingFlagsRunCard({
  operation,
  onRemove,
  onCancel,
  onPurge,
}: OperationRunCardProps<"MATCHING_FLAGS">) {
  const matchedCount = operation.matchingFlagsData.matchedCount ?? 0;
  const modeLabel = formatMatchingMode(operation.matchingFlagsData.mode);
  const modeDescription = operation.matchingFlagsData.mode.toLowerCase();

  return (
    <OperationRunCardFrame
      operationId={operation.id}
      title="Matching Flags"
      criterionSubtitle={`${modeLabel} "${operation.matchingFlagsData.pattern}"`}
      status={operation.status}
      createdAt={operation.createdAt}
      completedAt={operation.completedAt}
      statusContent={
        <FlagsPurgeStatusContent
          status={operation.status}
          scannedCount={operation.matchingFlagsData.scannedCount ?? 0}
          matchedCount={matchedCount}
          purgedCount={operation.matchingFlagsData.purgedCount ?? 0}
        />
      }
      canExecute={matchedCount > 0}
      executeLabel="Purge"
      executeVariant="destructive"
      confirm={{
        title: "Purge matching flags",
        itemLabel: `${matchedCount.toLocaleString()} flags matching ${
          operation.matchingFlagsData.pattern
        } (${modeDescription})`,
        confirmLabel: `Purge ${matchedCount.toLocaleString()} flags`,
        message: (
          <>
            This will permanently delete{" "}
            <span className="font-medium text-foreground">
              {matchedCount.toLocaleString()}
            </span>{" "}
            flags matching{" "}
            <span className="break-all font-medium text-foreground">
              {operation.matchingFlagsData.pattern}
            </span>{" "}
            ({modeDescription}). This action cannot be undone.
          </>
        ),
      }}
      onRemove={onRemove}
      onCancel={onCancel}
      onExecute={onPurge}
    />
  );
}

function V1MigrationRunCard({
  operation,
  onRemove,
  onCancel,
  onPurge,
}: OperationRunCardProps<"V1_MIGRATION">) {
  const { mocksFound, flagsFound, mocksMigrated, flagsMigrated, flagsSkipped } =
    operation.v1MigrationData;
  const foundCount = (mocksFound ?? 0) + (flagsFound ?? 0);

  return (
    <OperationRunCardFrame
      operationId={operation.id}
      title="Migrate from V1"
      criterionSubtitle={`Prefix "${operation.v1MigrationData.sourcePrefix}"`}
      status={operation.status}
      createdAt={operation.createdAt}
      completedAt={operation.completedAt}
      statusContent={
        <V1MigrationStatusContent
          status={operation.status}
          mocksFound={mocksFound ?? 0}
          flagsFound={flagsFound ?? 0}
          mocksMigrated={mocksMigrated ?? 0}
          flagsMigrated={flagsMigrated ?? 0}
          flagsSkipped={flagsSkipped ?? 0}
        />
      }
      canExecute={foundCount > 0}
      executeLabel="Migrate"
      executeVariant="default"
      onRemove={onRemove}
      onCancel={onCancel}
      onExecute={onPurge}
    />
  );
}

function V1PurgeRunCard({
  operation,
  onRemove,
  onCancel,
  onPurge,
}: OperationRunCardProps<"V1_PURGE">) {
  const keysFound = operation.v1PurgeData.keysFound ?? 0;
  const migrationCompletedAt = operation.v1PurgeData.migrationCompletedAt;

  return (
    <OperationRunCardFrame
      operationId={operation.id}
      title="Purge V1 Data"
      criterionSubtitle={`Prefix "${operation.v1PurgeData.sourcePrefix}"`}
      status={operation.status}
      createdAt={operation.createdAt}
      completedAt={operation.completedAt}
      statusContent={
        <V1PurgeStatusContent
          status={operation.status}
          keysFound={keysFound}
          purgedCount={operation.v1PurgeData.purgedCount ?? 0}
        />
      }
      canExecute={keysFound > 0}
      executeLabel="Purge"
      executeVariant="destructive"
      confirm={{
        title: "Purge V1 data",
        itemLabel: `${keysFound.toLocaleString()} V1 keys`,
        confirmLabel: `Purge ${keysFound.toLocaleString()} keys`,
        message: (
          <>
            This will permanently delete{" "}
            <span className="font-medium text-foreground">
              {keysFound.toLocaleString()}
            </span>{" "}
            V1 keys under{" "}
            <span className="break-all font-medium text-foreground">
              {operation.v1PurgeData.sourcePrefix}
            </span>
            . The migration completed{" "}
            <span className="font-medium text-foreground">
              {migrationCompletedAt ? formatDate(migrationCompletedAt) : ""}
            </span>
            . Flags written by V1 after that date will be lost, so make sure
            Mocko V1 is decommissioned. This action cannot be undone.
          </>
        ),
      }}
      onRemove={onRemove}
      onCancel={onCancel}
      onExecute={onPurge}
    />
  );
}

function OperationRunCardFrame({
  operationId,
  title,
  criterionSubtitle,
  status,
  createdAt,
  completedAt,
  statusContent,
  canExecute,
  executeLabel,
  executeVariant,
  confirm,
  onRemove,
  onCancel,
  onExecute,
}: OperationRunCardFrameProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const config = STATUS_CONFIG[status];
  const subtitleDate =
    status === "DONE" || status === "FAILED" ? completedAt : createdAt;
  const subtitle = `${config.subtitleVerb} ${
    subtitleDate ? formatDate(subtitleDate) : ""
  } · ${criterionSubtitle}`;
  const actions = getActions({
    status,
    createdAt,
    canExecute,
    executeLabel,
    executeVariant,
    onCancel: () => onCancel(operationId),
    onRemove: () => onRemove(operationId),
    onExecute: () => (confirm ? setConfirmOpen(true) : onExecute(operationId)),
  });

  return (
    <>
      <Card>
        <CardContent>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {title}
                </span>
                <Badge variant={config.badgeVariant}>{config.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">{statusContent}</div>
            {actions.length > 0 && (
              <div className="flex shrink-0 justify-end gap-2">{actions}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {confirm && (
        <ConfirmDeleteDialog
          open={confirmOpen}
          title={confirm.title}
          itemLabel={confirm.itemLabel}
          confirmLabel={confirm.confirmLabel}
          showDontAskAgain={false}
          onConfirm={() => {
            setConfirmOpen(false);
            onExecute(operationId);
          }}
          onCancel={() => setConfirmOpen(false)}
          onDontAskAgain={() => undefined}
        >
          {confirm.message}
        </ConfirmDeleteDialog>
      )}
    </>
  );
}

function FlagsPurgeStatusContent({
  status,
  scannedCount,
  matchedCount,
  purgedCount,
}: {
  status: OperationStatus;
  scannedCount: number;
  matchedCount: number;
  purgedCount: number;
}) {
  if (status === "SCANNING") {
    return (
      <LoadingLine>
        Scanned{" "}
        <span className="tabular-nums text-foreground">
          {scannedCount.toLocaleString()}
        </span>{" "}
        flags...
      </LoadingLine>
    );
  }

  if (status === "EXECUTING") {
    return <LoadingLine>Purging flags...</LoadingLine>;
  }

  if (status === "READY") {
    if (matchedCount === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          None of{" "}
          <span className="tabular-nums">{scannedCount.toLocaleString()}</span>{" "}
          flags would be purged
        </p>
      );
    }

    return (
      <p className="text-sm">
        <span className="tabular-nums font-medium text-foreground">
          {matchedCount.toLocaleString()}
        </span>
        <span className="text-muted-foreground">
          {" "}
          of{" "}
          <span className="tabular-nums">
            {scannedCount.toLocaleString()}
          </span>{" "}
          flags will be purged
        </span>
      </p>
    );
  }

  if (status === "DONE") {
    return (
      <p className="text-sm text-muted-foreground">
        <span className="tabular-nums font-medium text-foreground">
          {purgedCount.toLocaleString()}
        </span>{" "}
        flags purged
      </p>
    );
  }

  return null;
}

function V1MigrationStatusContent({
  status,
  mocksFound,
  flagsFound,
  mocksMigrated,
  flagsMigrated,
  flagsSkipped,
}: {
  status: OperationStatus;
  mocksFound: number;
  flagsFound: number;
  mocksMigrated: number;
  flagsMigrated: number;
  flagsSkipped: number;
}) {
  if (status === "SCANNING") {
    return <LoadingLine>Scanning V1 data...</LoadingLine>;
  }

  if (status === "EXECUTING") {
    return (
      <LoadingLine>
        Migrated{" "}
        <span className="tabular-nums text-foreground">
          {flagsMigrated.toLocaleString()}
        </span>{" "}
        flags...
      </LoadingLine>
    );
  }

  if (status === "READY") {
    if (mocksFound === 0 && flagsFound === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No V1 mocks or flags found, check the source prefix
        </p>
      );
    }

    return (
      <p className="text-sm">
        <span className="tabular-nums font-medium text-foreground">
          {mocksFound.toLocaleString()}
        </span>
        <span className="text-muted-foreground"> mocks and </span>
        <span className="tabular-nums font-medium text-foreground">
          {flagsFound.toLocaleString()}
        </span>
        <span className="text-muted-foreground"> flags will be migrated</span>
      </p>
    );
  }

  if (status === "DONE") {
    return (
      <p className="text-sm text-muted-foreground">
        <span className="tabular-nums font-medium text-foreground">
          {mocksMigrated.toLocaleString()}
        </span>{" "}
        mocks and{" "}
        <span className="tabular-nums font-medium text-foreground">
          {flagsMigrated.toLocaleString()}
        </span>{" "}
        flags migrated
        {flagsSkipped > 0 && (
          <>
            ,{" "}
            <span className="tabular-nums">
              {flagsSkipped.toLocaleString()}
            </span>{" "}
            expired flags skipped
          </>
        )}
      </p>
    );
  }

  return null;
}

function V1PurgeStatusContent({
  status,
  keysFound,
  purgedCount,
}: {
  status: OperationStatus;
  keysFound: number;
  purgedCount: number;
}) {
  if (status === "SCANNING") {
    return <LoadingLine>Counting V1 keys...</LoadingLine>;
  }

  if (status === "EXECUTING") {
    return <LoadingLine>Deleting V1 keys...</LoadingLine>;
  }

  if (status === "READY") {
    if (keysFound === 0) {
      return <p className="text-sm text-muted-foreground">No V1 keys found</p>;
    }

    return (
      <p className="text-sm">
        <span className="tabular-nums font-medium text-foreground">
          {keysFound.toLocaleString()}
        </span>
        <span className="text-muted-foreground"> V1 keys will be deleted</span>
      </p>
    );
  }

  if (status === "DONE") {
    return (
      <p className="text-sm text-muted-foreground">
        <span className="tabular-nums font-medium text-foreground">
          {purgedCount.toLocaleString()}
        </span>{" "}
        V1 keys deleted
      </p>
    );
  }

  return null;
}

function getActions({
  status,
  createdAt,
  canExecute,
  executeLabel,
  executeVariant,
  onCancel,
  onRemove,
  onExecute,
}: {
  status: OperationStatus;
  createdAt: string;
  canExecute: boolean;
  executeLabel: string;
  executeVariant: "default" | "destructive";
  onCancel: () => void;
  onRemove: () => void;
  onExecute: () => void;
}): ReactNode[] {
  if (
    (status === "SCANNING" || status === "EXECUTING") &&
    isOperationStuck(createdAt)
  ) {
    return [
      <Button key="cancel" variant="outline" size="sm" onClick={onCancel}>
        <XIcon aria-hidden="true" />
        Cancel
      </Button>,
    ];
  }

  if (status === "READY") {
    const actions = [
      <Button key="cancel" variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>,
    ];

    if (canExecute) {
      actions.push(
        <Button
          key="execute"
          variant={executeVariant}
          size="sm"
          onClick={onExecute}
        >
          {executeLabel}
        </Button>,
      );
    }

    return actions;
  }

  if (status === "DONE" || status === "FAILED") {
    return [
      <Button
        key="remove"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        aria-label="Remove this run"
      >
        <TrashIcon aria-hidden="true" />
        Remove
      </Button>,
    ];
  }

  return [];
}

function LoadingLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Loader2Icon
        className="size-3.5 shrink-0 animate-spin text-muted-foreground"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMatchingMode(mode: MatchingFlagsMode): string {
  switch (mode) {
    case "PREFIX":
      return "Prefix";
    case "CONTAINS":
      return "Contains";
    case "REGEX":
      return "Regex";
  }
}

function isOperationStuck(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > STUCK_OPERATION_AGE_MS;
}
