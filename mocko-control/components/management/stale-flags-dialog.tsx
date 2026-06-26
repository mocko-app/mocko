"use client";

import { useState } from "react";
import { Callout } from "@/components/callout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SECONDS_PER_DAY = 86_400;

type StaleFlagsDialogProps = {
  open: boolean;
  sentinelAgeSeconds: number | null;
  isStarting: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (thresholdSeconds: number) => Promise<void>;
};

export function StaleFlagsDialog({
  open,
  sentinelAgeSeconds,
  isStarting,
  onOpenChange,
  onStart,
}: StaleFlagsDialogProps) {
  const [thresholdDays, setThresholdDays] = useState("60");
  const thresholdSeconds = Number(thresholdDays) * SECONDS_PER_DAY;
  const canStart = isValidThresholdDays(thresholdDays);
  const showSentinelWarning =
    sentinelAgeSeconds !== null &&
    Number.isInteger(Number(thresholdDays)) &&
    thresholdSeconds > sentinelAgeSeconds;

  async function handleStart() {
    if (!canStart) {
      return;
    }

    await onStart(thresholdSeconds);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={!canStart || isStarting}>
            Start scan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function isValidThresholdDays(value: string): boolean {
  const parsed = Number(value);
  return Boolean(value) && Number.isInteger(parsed) && parsed >= 1;
}
