"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MockFormHostField } from "@/components/mock-form-host-field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HeadersEditor } from "@/components/headers-editor";
import { cn } from "@/lib/utils";

type MockFormAdvancedOptionsProps = {
  delay: string;
  delayError?: string;
  delayHasError?: boolean;
  headers: { key: string; value: string }[];
  hostSlug: string;
  isReadOnly?: boolean;
  isSubmitting?: boolean;
  lockedHeaders: { key: string; value: string }[];
  onDelayChange: (delay: string) => void;
  onHeadersChange: (headers: { key: string; value: string }[]) => void;
  onHostSlugChange: (hostSlug: string) => void;
};

export function MockFormAdvancedOptions({
  delay,
  delayError,
  delayHasError,
  headers,
  hostSlug,
  isReadOnly = false,
  isSubmitting = false,
  lockedHeaders,
  onDelayChange,
  onHeadersChange,
  onHostSlugChange,
}: MockFormAdvancedOptionsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const parsedDelay = delay.trim() === "" ? null : Number(delay);
  const showDelayWarning =
    !delayHasError &&
    parsedDelay !== null &&
    !Number.isNaN(parsedDelay) &&
    parsedDelay < 50;

  return (
    <Collapsible
      open={advancedOpen}
      onOpenChange={setAdvancedOpen}
      className="flex flex-col gap-2"
    >
      <CollapsibleTrigger className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground">
        <ChevronDownIcon
          className={cn(
            "size-4 transition-transform",
            advancedOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
        Advanced options
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 flex flex-col gap-4">
        <div className="flex w-full flex-col gap-1.5">
          <Label>Response headers</Label>
          <HeadersEditor
            headers={headers}
            onChange={onHeadersChange}
            lockedHeaders={lockedHeaders}
            readOnly={isReadOnly}
          />
        </div>
        <MockFormHostField
          hostSlug={hostSlug}
          isReadOnly={isReadOnly}
          isSubmitting={isSubmitting}
          onHostSlugChange={onHostSlugChange}
        />
        <div className="flex w-full max-w-48 flex-col gap-1.5">
          <Label htmlFor="mock-delay">Delay (ms)</Label>
          <Input
            id="mock-delay"
            type="number"
            min={0}
            max={300000}
            value={delay}
            onChange={(e) => onDelayChange(e.target.value)}
            placeholder="Optional"
            aria-invalid={Boolean(delayHasError)}
            readOnly={isReadOnly}
          />
          {delayError && (
            <p className="text-xs text-destructive">{delayError}</p>
          )}
          {showDelayWarning && (
            <p className="text-xs text-amber-400">
              Delay is in milliseconds, not seconds.
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
