"use client";

import { useState, type ReactNode } from "react";
import { Loader2Icon, TrashIcon, XIcon } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Operation, OperationStatus } from "@/lib/types/operation";

const SECONDS_PER_DAY = 86_400;
const STUCK_OPERATION_AGE_MS = 5 * 60 * 1000;

type RunCardProps = {
  operation: Operation;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onPurge: (id: string) => void;
};

type StatusConfig = {
  label: string;
  badgeVariant:
    | "statusInfo"
    | "statusWarning"
    | "statusSuccess"
    | "statusDanger";
  subtitleVerb: "Started" | "Completed" | "Failed";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RunCard({
  operation,
  onRemove,
  onCancel,
  onPurge,
}: RunCardProps) {
  const [purgeOpen, setPurgeOpen] = useState(false);
  const config = STATUS_CONFIG[operation.status];
  const thresholdDays = getThresholdDays(operation);
  const subtitleDate =
    operation.status === "DONE" || operation.status === "FAILED"
      ? operation.completedAt
      : operation.createdAt;
  const subtitle = `${config.subtitleVerb} ${
    subtitleDate ? formatDate(subtitleDate) : ""
  } · ${thresholdDays}-day threshold`;
  const staleFlags = operation.staleFlagsData.staleFlags ?? 0;
  const isStuck = isOperationStuck(operation);
  const content = getStatusContent(operation);
  const actions = getActions(operation, {
    isStuck,
    onCancel: () => onCancel(operation.id),
    onRemove: () => onRemove(operation.id),
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
                  Stale Flags
                </span>
                <Badge variant={config.badgeVariant}>{config.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">{content}</div>
            {actions.length > 0 && (
              <div className="flex shrink-0 justify-end gap-2">{actions}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={purgeOpen}
        title="Purge stale flags"
        itemLabel={`${staleFlags.toLocaleString()} stale flags`}
        confirmLabel={`Purge ${staleFlags.toLocaleString()} flags`}
        showDontAskAgain={false}
        onConfirm={() => {
          setPurgeOpen(false);
          onPurge(operation.id);
        }}
        onCancel={() => setPurgeOpen(false)}
        onDontAskAgain={() => undefined}
      >
        This will permanently delete{" "}
        <span className="font-medium text-foreground">
          {staleFlags.toLocaleString()}
        </span>{" "}
        flags that have not been read or written in the last{" "}
        <span className="font-medium text-foreground">
          {thresholdDays} days
        </span>
        . This action cannot be undone.
      </ConfirmDeleteDialog>
    </>
  );
}

function getStatusContent(operation: Operation): ReactNode {
  const data = operation.staleFlagsData;

  if (operation.status === "SCANNING") {
    return (
      <LoadingLine>
        Scanned{" "}
        <span className="tabular-nums text-foreground">
          {(data.scannedCount ?? 0).toLocaleString()}
        </span>{" "}
        flags...
      </LoadingLine>
    );
  }

  if (operation.status === "EXECUTING") {
    return <LoadingLine>Purging flags...</LoadingLine>;
  }

  if (operation.status === "READY") {
    const staleFlags = data.staleFlags ?? 0;
    if (staleFlags === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          None of{" "}
          <span className="tabular-nums">
            {data.scannedCount?.toLocaleString()}
          </span>{" "}
          flags would be purged
        </p>
      );
    }

    return (
      <p className="text-sm">
        <span className="tabular-nums font-medium text-foreground">
          {staleFlags.toLocaleString()}
        </span>
        <span className="text-muted-foreground">
          {" "}
          of{" "}
          <span className="tabular-nums">
            {data.scannedCount?.toLocaleString()}
          </span>{" "}
          flags will be purged
        </span>
      </p>
    );
  }

  if (operation.status === "DONE") {
    return (
      <p className="text-sm text-muted-foreground">
        <span className="tabular-nums font-medium text-foreground">
          {data.purgedCount?.toLocaleString()}
        </span>{" "}
        flags purged
      </p>
    );
  }

  return null;
}

function getActions(
  operation: Operation,
  handlers: {
    isStuck: boolean;
    onCancel: () => void;
    onRemove: () => void;
    onPurge: () => void;
  },
): ReactNode[] {
  if (
    (operation.status === "SCANNING" || operation.status === "EXECUTING") &&
    handlers.isStuck
  ) {
    return [
      <Button
        key="cancel"
        variant="outline"
        size="sm"
        onClick={handlers.onCancel}
      >
        <XIcon aria-hidden="true" />
        Cancel
      </Button>,
    ];
  }

  if (operation.status === "READY") {
    const actions = [
      <Button
        key="cancel"
        variant="outline"
        size="sm"
        onClick={handlers.onCancel}
      >
        Cancel
      </Button>,
    ];

    if ((operation.staleFlagsData.staleFlags ?? 0) > 0) {
      actions.push(
        <Button
          key="purge"
          variant="destructive"
          size="sm"
          onClick={handlers.onPurge}
        >
          Purge
        </Button>,
      );
    }

    return actions;
  }

  if (operation.status === "DONE" || operation.status === "FAILED") {
    return [
      <Button
        key="remove"
        variant="ghost"
        size="sm"
        onClick={handlers.onRemove}
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

function getThresholdDays(operation: Operation): number {
  return Math.round(
    operation.staleFlagsData.thresholdSeconds / SECONDS_PER_DAY,
  );
}

function isOperationStuck(operation: Operation): boolean {
  if (operation.status !== "SCANNING" && operation.status !== "EXECUTING") {
    return false;
  }

  return (
    Date.now() - new Date(operation.createdAt).getTime() >
    STUCK_OPERATION_AGE_MS
  );
}
