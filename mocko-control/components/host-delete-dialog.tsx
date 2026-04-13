"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type HostDeleteDialogProps = {
  open: boolean;
  hostSlug: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDontAskAgain: () => void;
};

export function HostDeleteDialog({
  open,
  hostSlug,
  onConfirm,
  onCancel,
  onDontAskAgain,
}: HostDeleteDialogProps) {
  const [skipConfirm, setSkipConfirm] = useState(false);

  function handleConfirm() {
    if (skipConfirm) {
      onDontAskAgain();
    }
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        aria-labelledby="host-delete-dialog-title"
        aria-describedby="host-delete-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="host-delete-dialog-title">Delete host</DialogTitle>
          <DialogDescription id="host-delete-dialog-description">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground font-mono">
              {hostSlug}
            </span>
            ? This will remove the host permanently. Mocks referencing this host
            will no longer be scoped.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-1">
          <Checkbox
            id="host-dont-ask-again"
            checked={skipConfirm}
            onCheckedChange={(checked) => setSkipConfirm(checked === true)}
            aria-label="Don't ask again this session"
          />
          <Label
            htmlFor="host-dont-ask-again"
            className="font-normal cursor-pointer"
          >
            Don&apos;t ask again this session
          </Label>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            aria-label="Cancel deletion"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            aria-label={`Confirm deletion of ${hostSlug}`}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
