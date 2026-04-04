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

interface DeleteDialogProps {
  open: boolean;
  mockName: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDontAskAgain: () => void;
}

export function DeleteDialog({
  open,
  mockName,
  onConfirm,
  onCancel,
  onDontAskAgain,
}: DeleteDialogProps) {
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
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="delete-dialog-title">Delete mock</DialogTitle>
          <DialogDescription id="delete-dialog-description">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{mockName}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-1">
          <Checkbox
            id="dont-ask-again"
            checked={skipConfirm}
            onCheckedChange={(checked) => setSkipConfirm(checked === true)}
            aria-label="Don't ask again this session"
          />
          <Label
            htmlFor="dont-ask-again"
            className="font-normal cursor-pointer"
          >
            Don&apos;t ask again this session
          </Label>
        </div>
        <DialogFooter className="border-[#2e2e2e]">
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
            aria-label={`Confirm deletion of ${mockName}`}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
