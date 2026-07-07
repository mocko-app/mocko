"use client";

import { BracesIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type FormatJsonButtonProps = {
  value: string;
  onFormat: (formatted: string) => void;
  disabled?: boolean;
};

export function FormatJsonButton({
  value,
  onFormat,
  disabled = false,
}: FormatJsonButtonProps) {
  function handleFormat() {
    if (!value.trim()) {
      return;
    }
    try {
      const formatted = JSON.stringify(JSON.parse(value), null, 2);
      if (formatted !== value) {
        onFormat(formatted);
      }
    } catch {
      toast.error("Can't format: content is not valid JSON.");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleFormat}
      disabled={disabled}
      aria-label="Format JSON"
    >
      <BracesIcon aria-hidden="true" />
      Format
    </Button>
  );
}
