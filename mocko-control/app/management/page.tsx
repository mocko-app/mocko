"use client";

import { useState } from "react";
import { ArrowRightIcon, TimerIcon } from "lucide-react";
import { toast } from "sonner";
import { ListPageHeader } from "@/components/list-page-header";
import { Callout } from "@/components/callout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { RunCard } from "@/components/management/run-card";
import {
  createOperation,
  deleteOperation,
  executeOperation,
} from "@/lib/frontend/api";
import { useOperations } from "@/lib/frontend/hooks/resources";

const SECONDS_PER_DAY = 86_400;

export default function ManagementPage() {
  const { data, error, isLoading, mutate } = useOperations();
  const [startOpen, setStartOpen] = useState(false);
  const [thresholdDays, setThresholdDays] = useState("60");
  const [isStarting, setIsStarting] = useState(false);

  const managementSupported = data?.managementSupported ?? true;
  const sentinelAgeSeconds = data?.sentinelAgeSeconds ?? null;
  const thresholdSeconds = Number(thresholdDays) * SECONDS_PER_DAY;
  const showSentinelWarning =
    sentinelAgeSeconds !== null &&
    Number.isInteger(Number(thresholdDays)) &&
    thresholdSeconds > sentinelAgeSeconds;
  const operations = data?.operations ?? [];

  async function handleRemove(id: string) {
    try {
      await deleteOperation(id);
      await mutate();
    } catch (removeError) {
      console.error("Failed to remove operation", removeError);
      toast.error("Failed to remove operation");
    }
  }

  async function handlePurge(id: string) {
    try {
      await executeOperation(id);
      await mutate();
    } catch (purgeError) {
      console.error("Failed to start purge", purgeError);
      toast.error("Failed to start purge");
    }
  }

  async function handleStart() {
    if (!isValidThresholdDays(thresholdDays)) {
      return;
    }

    setIsStarting(true);
    try {
      await createOperation(Number(thresholdDays) * SECONDS_PER_DAY);
      await mutate();
      setStartOpen(false);
    } catch (startError) {
      console.error("Failed to start operation", startError);
      toast.error("Failed to start operation");
    } finally {
      setIsStarting(false);
    }
  }

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
          <OperationCard
            icon={
              <TimerIcon className="size-5 text-primary" aria-hidden="true" />
            }
            name="Stale Flags"
            description="Scan and remove flags that have not been read or written within a configurable number of days."
            onStart={() => setStartOpen(true)}
            disabled={!managementSupported}
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
                  onRemove={handleRemove}
                  onCancel={handleRemove}
                  onPurge={handlePurge}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={startOpen} onOpenChange={(o) => !o && setStartOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stale Flags</DialogTitle>
            <DialogDescription>
              Flags not read or written within the threshold will be identified
              for removal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="threshold-days">Threshold (days)</Label>
            <Input
              id="threshold-days"
              type="number"
              min={1}
              value={thresholdDays}
              onChange={(e) => setThresholdDays(e.target.value)}
              placeholder="60"
            />
            <p className="text-xs text-muted-foreground">
              Flags idle for longer than this will be included in the scan.
            </p>
            {showSentinelWarning && (
              <Callout
                title="Threshold exceeds Redis age"
                message="Redis has not been observed long enough to prove that flags are older than this threshold."
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              disabled={!isValidThresholdDays(thresholdDays) || isStarting}
            >
              Start scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type OperationCardProps = {
  icon: React.ReactNode;
  name: string;
  description: string;
  onStart: () => void;
  disabled: boolean;
};

function OperationCard({
  icon,
  name,
  description,
  onStart,
  disabled,
}: OperationCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <Badge variant="outline">Beta</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="shrink-0">
          <Button size="sm" onClick={onStart} disabled={disabled}>
            Start
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function isValidThresholdDays(value: string): boolean {
  const parsed = Number(value);
  return Boolean(value) && Number.isInteger(parsed) && parsed >= 1;
}
