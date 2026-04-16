"use client";

import { useId, useState, type ReactNode } from "react";
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

type ConfirmDeleteDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  itemLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDontAskAgain: () => void;
};

export function ConfirmDeleteDialog({
  open,
  title,
  children,
  itemLabel,
  onConfirm,
  onCancel,
  onDontAskAgain,
}: ConfirmDeleteDialogProps) {
  const [skipConfirm, setSkipConfirm] = useState(false);
  const descriptionId = useId();
  const titleId = useId();
  const checkboxId = useId();

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
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <DialogHeader>
          <DialogTitle id={titleId}>{title}</DialogTitle>
          <DialogDescription id={descriptionId}>{children}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-1">
          <Checkbox
            id={checkboxId}
            checked={skipConfirm}
            onCheckedChange={(checked) => setSkipConfirm(checked === true)}
            aria-label="Don't ask again this session"
          />
          <Label htmlFor={checkboxId} className="cursor-pointer font-normal">
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
            aria-label={`Confirm deletion of ${itemLabel}`}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
