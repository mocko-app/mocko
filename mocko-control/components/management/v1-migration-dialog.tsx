"use client";

import { useState } from "react";
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

type V1MigrationDialogProps = {
  open: boolean;
  defaultSourcePrefix: string;
  isStarting: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (sourcePrefix: string) => Promise<void>;
};

export function V1MigrationDialog({
  open,
  defaultSourcePrefix,
  isStarting,
  onOpenChange,
  onStart,
}: V1MigrationDialogProps) {
  const [sourcePrefix, setSourcePrefix] = useState(defaultSourcePrefix);
  const canStart = sourcePrefix.trim().length > 0;

  async function handleStart() {
    if (!canStart) {
      return;
    }

    await onStart(sourcePrefix.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Migrate from V1</DialogTitle>
          <DialogDescription>
            The mocks and flags stored under the V1 prefix will be identified
            for migration. Nothing is written before you confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="source-prefix">V1 Redis prefix</Label>
          <Input
            id="source-prefix"
            value={sourcePrefix}
            onChange={(e) => setSourcePrefix(e.target.value)}
            placeholder="mocko:"
          />
          <p className="text-xs text-muted-foreground">
            Helm installs of V1 used the release name as the prefix.
          </p>
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
