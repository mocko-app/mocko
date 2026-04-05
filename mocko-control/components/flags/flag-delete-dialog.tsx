"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type FlagDeleteDialogProps = {
  open: boolean;
  flagKey: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDontAskAgain: () => void;
};

export function FlagDeleteDialog({
  open,
  flagKey,
  onConfirm,
  onCancel,
  onDontAskAgain,
}: FlagDeleteDialogProps) {
  const [skipConfirm, setSkipConfirm] = useState(false);

  function handleConfirm() {
    if (skipConfirm) {
      onDontAskAgain();
    }
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        aria-labelledby="delete-flag-title"
        aria-describedby="delete-flag-description"
      >
        <DialogHeader>
          <DialogTitle id="delete-flag-title">Delete flag</DialogTitle>
          <DialogDescription id="delete-flag-description">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground font-mono">
              {flagKey}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-1">
          <Checkbox
            id="dont-ask-again-flag"
            checked={skipConfirm}
            onCheckedChange={(checked) => setSkipConfirm(checked === true)}
            aria-label="Don't ask again this session"
          />
          <Label
            htmlFor="dont-ask-again-flag"
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
            aria-label={`Confirm deletion of ${flagKey}`}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
