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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { MatchingFlagsMode } from "@/lib/types/operation";

const MATCHING_MODE_OPTIONS: Array<{
  value: MatchingFlagsMode;
  label: string;
  placeholder: string;
  hint: string;
}> = [
  {
    value: "PREFIX",
    label: "Prefix",
    placeholder: "payments:",
    hint: "Matches flag keys that start with this exact text.",
  },
  {
    value: "CONTAINS",
    label: "Contains",
    placeholder: "john.doe@mail.me",
    hint: "Matches flag keys that include this exact text anywhere.",
  },
  {
    value: "REGEX",
    label: "Regex",
    placeholder: "^payments:.*:enabled$",
    hint: "Matches flag keys with this regular expression.",
  },
];

type MatchingFlagsDialogProps = {
  open: boolean;
  isStarting: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (mode: MatchingFlagsMode, pattern: string) => Promise<void>;
};

export function MatchingFlagsDialog({
  open,
  isStarting,
  onOpenChange,
  onStart,
}: MatchingFlagsDialogProps) {
  const [mode, setMode] = useState<MatchingFlagsMode>("PREFIX");
  const [pattern, setPattern] = useState("");
  const activeMode = MATCHING_MODE_OPTIONS.find(
    (option) => option.value === mode,
  )!;
  const patternError = getMatchingPatternError(mode, pattern);
  const canStart = pattern.length > 0 && patternError === null;

  async function handleStart() {
    if (!canStart) {
      return;
    }

    await onStart(mode, pattern);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Matching Flags</DialogTitle>
          <DialogDescription>
            Flags with keys matching the selected pattern will be identified for
            removal.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <ToggleGroup
            value={[mode]}
            onValueChange={(values) => {
              if (values.length > 0) {
                setMode(values[0] as MatchingFlagsMode);
              }
            }}
            variant="default"
            size="sm"
          >
            {MATCHING_MODE_OPTIONS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="matching-pattern">Pattern</Label>
            <Input
              id="matching-pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={activeMode.placeholder}
              aria-invalid={Boolean(patternError)}
            />
            {patternError ? (
              <p className="text-xs text-destructive">{patternError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{activeMode.hint}</p>
            )}
          </div>
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

function getMatchingPatternError(
  mode: MatchingFlagsMode,
  pattern: string,
): string | null {
  if (!pattern || mode !== "REGEX") {
    return null;
  }

  try {
    new RegExp(pattern);
    return null;
  } catch {
    return "Invalid regular expression";
  }
}
