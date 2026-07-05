"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DocsSnippet({
  command,
  output,
  className,
}: {
  command: string;
  output?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card px-4 py-2.5 font-mono text-[13px]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="select-none font-semibold text-primary">$</span>
          <span className="overflow-x-auto whitespace-nowrap text-foreground">
            {command}
          </span>
        </div>
        <button
          type="button"
          aria-label="Copy to clipboard"
          onClick={copy}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-border hover:text-fg-2"
        >
          {copied ? (
            <CheckIcon className="size-3.5 text-primary" aria-hidden />
          ) : (
            <CopyIcon className="size-3.5" aria-hidden />
          )}
        </button>
      </div>
      {output ? (
        <div className="mt-1 whitespace-pre-wrap pl-[18px] text-muted-foreground">
          {output}
        </div>
      ) : null}
    </div>
  );
}
