"use client";

import Link from "next/link";
import {
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ZapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  onFire: (definition: CallbackDto) => void;
  onEdit: (slug: string) => void;
  onDelete: (definition: CallbackDto) => void;
}> = ({ definition, onFire, onEdit, onDelete }) => {
  const displayName = definition.name || definition.slug;
  const isReadOnly = definition.annotations.includes("READ_ONLY");

  return (
    <div
      className="group relative rounded-lg border border-border bg-card transition-colors hover:border-[#252528]"
      role="listitem"
      aria-label={`Callback: ${displayName}`}
    >
      <Link
        href={`/callbacks/${definition.slug}`}
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
          </div>
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

        <div className="flex items-center gap-2.5 shrink-0 pointer-events-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFire(definition)}
            aria-label={`Fire ${displayName}`}
          >
            <ZapIcon aria-hidden="true" />
            Fire
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-[#444] hover:text-[#888] hover:bg-transparent focus-visible:text-[#888]"
                  aria-label={`Actions for ${displayName}`}
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isReadOnly ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(definition.slug)}>
                    <PencilIcon aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(definition)}
                  >
                    <TrashIcon aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onEdit(definition.slug)}>
                  <PencilIcon aria-hidden="true" />
                  View
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
