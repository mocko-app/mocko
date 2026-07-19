"use client";

import Link from "next/link";
import { HourglassIcon, XIcon, ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCountdown } from "@/lib/callback/callback-format";
import type {
  CallbackDto,
  PendingCallbackDto,
} from "@/lib/types/callback-dtos";
import { cn } from "@/lib/utils";

export const PendingCallbackCard: React.FC<{
  pending: PendingCallbackDto;
  definition?: CallbackDto;
  triggeredByMockName?: string;
  now: number;
  onFire: (pending: PendingCallbackDto) => void;
  onCancel: (pending: PendingCallbackDto) => void;
}> = ({ pending, definition, triggeredByMockName, now, onFire, onCancel }) => {
  const displayName = definition?.name || pending.slug;

  return (
    <div
      className="rounded-lg border border-border bg-card px-4 py-3.5 transition-colors hover:border-[#252528]"
      role="listitem"
      aria-label={`Pending callback: ${displayName}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "text-sm font-medium text-white truncate",
                !definition?.name && "font-mono",
              )}
            >
              {displayName}
            </span>
            {definition?.name && (
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                {pending.slug}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-4xl bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tabular-nums shrink-0">
              <HourglassIcon className="size-3" aria-hidden="true" />
              {formatCountdown(pending.dueAt - now)}
            </span>
          </div>
          <div className="mt-1.5 font-mono text-xs text-muted-foreground truncate">
            {JSON.stringify(pending.payload)}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">
              {new Date(pending.dueAt).toLocaleString()}
            </span>
            {pending.triggeredByMockId && (
              <span className="whitespace-nowrap">
                via{" "}
                <Link
                  href={`/mocks/${pending.triggeredByMockId}`}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {triggeredByMockName || "mock"}
                </Link>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFire(pending)}
            aria-label={`Fire ${displayName} now`}
          >
            <ZapIcon aria-hidden="true" />
            Fire now
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-[#444] hover:text-red-400 hover:bg-transparent"
            onClick={() => onCancel(pending)}
            aria-label={`Cancel pending ${displayName}`}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
};
