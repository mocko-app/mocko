"use client";

import Link from "next/link";
import { CallbackActionsMenu } from "@/components/callbacks/callback-actions-menu";
import { CallbackConflictBadge } from "@/components/callbacks/callback-conflict-badge";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { targetLabel } from "@/lib/callback/callback-format";
import type { CallbackMethod } from "@/lib/types/callback";
import type { CallbackDto } from "@/lib/types/callback-dtos";
import { cn } from "@/lib/utils";

const METHOD_COLORS: Record<CallbackMethod, string> = {
  GET: "text-sky-400",
  POST: "text-emerald-500",
  PUT: "text-amber-400",
  PATCH: "text-violet-400",
  DELETE: "text-red-400",
};

export const CallbackDefinitionCard: React.FC<{
  definition: CallbackDto;
  href: string;
  canFire: boolean;
  onFire: (definition: CallbackDto) => void;
  onEdit: (id: string) => void;
  onDelete: (definition: CallbackDto) => void;
  onOverride?: (id: string) => void;
}> = ({ definition, href, canFire, onFire, onEdit, onDelete, onOverride }) => {
  const displayName = definition.name || definition.slug;
  const isReadOnly = definition.annotations.includes("READ_ONLY");

  return (
    <div
      className="group relative rounded-lg border border-border bg-card transition-colors hover:border-[#252528]"
      role="listitem"
      aria-label={`Callback: ${displayName}`}
    >
      <Link
        href={href}
        aria-label={`Open ${displayName}`}
        className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      />
      <div className="relative z-10 flex items-center gap-4 px-4 py-3.5 pointer-events-none">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "text-sm font-medium text-white truncate",
                !definition.name && "font-mono",
              )}
            >
              {displayName}
            </span>
            {definition.name && (
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                {definition.slug}
              </span>
            )}
            {definition.annotations.includes("TEMPORARY") && (
              <Badge variant="annotationTemporary">Temporary</Badge>
            )}
            {isReadOnly && (
              <Badge variant="annotationReadOnly">Read Only</Badge>
            )}
            <CallbackConflictBadge
              annotations={definition.annotations}
              className="relative z-10 pointer-events-auto"
            />
          </div>
          {definition.filePath && (
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="truncate text-xs text-muted-foreground">
                {definition.filePath}
              </p>
              <CopyButton
                value={definition.filePath}
                label="Source file"
                revealOnHover
                className="relative z-10 pointer-events-auto"
              />
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-2 font-mono text-xs">
            <span
              className={cn(
                METHOD_COLORS[definition.method] ?? "text-muted-foreground",
                "tracking-wider shrink-0",
              )}
            >
              {definition.method}
            </span>
            <span className="text-muted-foreground truncate">
              {targetLabel(definition)}
            </span>
          </div>
        </div>

        <div className="flex items-center shrink-0 pointer-events-auto">
          <CallbackActionsMenu
            definition={definition}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-[#444] hover:text-[#888] hover:bg-transparent focus-visible:text-[#888]"
                aria-label={`Actions for ${displayName}`}
              />
            }
            canFire={canFire}
            onFire={onFire}
            onEdit={onEdit}
            onDelete={onDelete}
            onOverride={onOverride}
          />
        </div>
      </div>
    </div>
  );
};
