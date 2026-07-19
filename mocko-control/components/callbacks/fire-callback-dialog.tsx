"use client";

import { useId, useState } from "react";
import { ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { targetLabel } from "@/lib/callback/callback-format";
import type { CallbackDto } from "@/lib/types/callback-dtos";

export const FireCallbackDialog: React.FC<{
  definition: CallbackDto;
  isFiring: boolean;
  onFire: (definition: CallbackDto, payload: unknown) => void;
  onClose: () => void;
}> = ({ definition, isFiring, onFire, onClose }) => {
  const [payloadText, setPayloadText] = useState("");
  const [payloadError, setPayloadError] = useState<string>();
  const titleId = useId();
  const descriptionId = useId();
  const displayName = definition.name || definition.slug;

  function handleFire() {
    const text = payloadText.trim();
    if (!text) {
      onFire(definition, undefined);
      return;
    }

    try {
      onFire(definition, JSON.parse(text));
    } catch {
      setPayloadError("Payload must be valid JSON.");
    }
  }

  return (
    <Dialog open={true} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <DialogHeader>
          <DialogTitle id={titleId}>Fire {displayName}</DialogTitle>
          <DialogDescription id={descriptionId}>
            Delivers{" "}
            <span className="font-mono text-foreground">
              {definition.method}
            </span>{" "}
            to{" "}
            <span className="font-mono text-foreground">
              {targetLabel(definition)}
            </span>{" "}
            immediately, skipping the delay.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Textarea
            value={payloadText}
            onChange={(event) => {
              setPayloadText(event.target.value);
              setPayloadError(undefined);
            }}
            placeholder={'{ "key": "value" }'}
            className="min-h-28 font-mono text-xs"
            aria-label="Callback payload"
          />
          {payloadError ? (
            <p className="text-xs text-destructive">{payloadError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Optional JSON payload, available as{" "}
              <span className="font-mono">payload</span> in the callback
              templates.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} aria-label="Cancel">
            Cancel
          </Button>
          <Button
            onClick={handleFire}
            disabled={isFiring}
            aria-label={`Confirm firing ${displayName}`}
          >
            <ZapIcon aria-hidden="true" />
            Fire callback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
