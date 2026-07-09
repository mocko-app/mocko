"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  value: string;
  label?: string;
  size?: "icon-xs" | "icon-sm" | "icon";
  revealOnHover?: boolean;
  className?: string;
};

export function CopyButton({
  value,
  label = "Value",
  size = "icon-xs",
  revealOnHover = false,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimeout.current), []);

  async function handleCopy(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard.`);
      clearTimeout(resetTimeout.current);
      resetTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            nativeButton={false}
            render={<span />}
            variant="ghost"
            size={size}
            onClick={handleCopy}
            aria-label={`Copy ${label.toLowerCase()}`}
            className={cn(
              "shrink-0 text-muted-foreground",
              revealOnHover &&
                "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
              className,
            )}
          />
        }
      >
        {copied ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )}
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : "Copy to clipboard"}</TooltipContent>
    </Tooltip>
  );
}
