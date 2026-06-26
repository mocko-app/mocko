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

type OperationRunCardFrameProps = {
  operationId: string;
  title: string;
  criterionSubtitle: string;
  status: OperationStatus;
  createdAt: string;
  completedAt?: string;
  scannedCount: number;
  matchedCount: number;
  purgedCount: number;
  confirmTitle: string;
  confirmItemLabel: string;
  confirmMessage: ReactNode;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onPurge: (id: string) => void;
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
      scannedCount={operation.staleFlagsData.scannedCount ?? 0}
      matchedCount={matchedCount}
      purgedCount={operation.staleFlagsData.purgedCount ?? 0}
      confirmTitle="Purge stale flags"
      confirmItemLabel={`${matchedCount.toLocaleString()} stale flags`}
      confirmMessage={
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
      }
      onRemove={onRemove}
      onCancel={onCancel}
      onPurge={onPurge}
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
      scannedCount={operation.matchingFlagsData.scannedCount ?? 0}
      matchedCount={matchedCount}
      purgedCount={operation.matchingFlagsData.purgedCount ?? 0}
      confirmTitle="Purge matching flags"
      confirmItemLabel={`${matchedCount.toLocaleString()} flags matching ${
        operation.matchingFlagsData.pattern
      } (${modeDescription})`}
      confirmMessage={
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
      }
      onRemove={onRemove}
      onCancel={onCancel}
      onPurge={onPurge}
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
  scannedCount,
  matchedCount,
  purgedCount,
  confirmTitle,
  confirmItemLabel,
  confirmMessage,
  onRemove,
  onCancel,
  onPurge,
}: OperationRunCardFrameProps) {
  const [purgeOpen, setPurgeOpen] = useState(false);
  const config = STATUS_CONFIG[status];
  const subtitleDate =
    status === "DONE" || status === "FAILED" ? completedAt : createdAt;
  const subtitle = `${config.subtitleVerb} ${
    subtitleDate ? formatDate(subtitleDate) : ""
  } · ${criterionSubtitle}`;
  const actions = getActions({
    status,
    createdAt,
    matchedCount,
    onCancel: () => onCancel(operationId),
    onRemove: () => onRemove(operationId),
    onPurge: () => setPurgeOpen(true),
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
            <div className="min-w-0">
              <StatusContent
                status={status}
                scannedCount={scannedCount}
                matchedCount={matchedCount}
                purgedCount={purgedCount}
              />
            </div>
            {actions.length > 0 && (
              <div className="flex shrink-0 justify-end gap-2">{actions}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={purgeOpen}
        title={confirmTitle}
        itemLabel={confirmItemLabel}
        confirmLabel={`Purge ${matchedCount.toLocaleString()} flags`}
        showDontAskAgain={false}
        onConfirm={() => {
          setPurgeOpen(false);
          onPurge(operationId);
        }}
        onCancel={() => setPurgeOpen(false)}
        onDontAskAgain={() => undefined}
      >
        {confirmMessage}
      </ConfirmDeleteDialog>
    </>
  );
}

function StatusContent({
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

function getActions({
  status,
  createdAt,
  matchedCount,
  onCancel,
  onRemove,
  onPurge,
}: {
  status: OperationStatus;
  createdAt: string;
  matchedCount: number;
  onCancel: () => void;
  onRemove: () => void;
  onPurge: () => void;
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

    if (matchedCount > 0) {
      actions.push(
        <Button key="purge" variant="destructive" size="sm" onClick={onPurge}>
          Purge
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
