"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDiscardDialogProps = {
  open: boolean;
  onDiscard: () => void;
  onKeepEditing: () => void;
};

export function ConfirmDiscardDialog({
  open,
  onDiscard,
  onKeepEditing,
}: ConfirmDiscardDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onKeepEditing()}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <DialogHeader>
          <DialogTitle id={titleId}>Unsaved changes</DialogTitle>
          <DialogDescription id={descriptionId}>
            You have unsaved changes. Discard them?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onKeepEditing}>
            Keep editing
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            Discard changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
