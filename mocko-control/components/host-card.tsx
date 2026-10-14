"use client";

import Link from "next/link";
import {
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { HostConflictBadge } from "@/components/host-conflict-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HostDto } from "@/lib/types/host-dtos";

export const HostCard: React.FC<{
  host: HostDto;
  onEdit: (id: string) => void;
  onDelete: (host: HostDto) => void;
}> = ({ host, onEdit, onDelete }) => {
  const isReadOnly = host.annotations.includes("READ_ONLY");
  const href = `/hosts/${host.id}`;

  return (
    <div
      className="group relative rounded-lg border border-border bg-card transition-colors hover:border-[#252528]"
      role="listitem"
      aria-label={`Host: ${host.slug}`}
    >
      <Link
        href={href}
        aria-label={`Open ${host.slug}`}
        className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      />
      <div className="relative z-10 flex items-center gap-4 px-4 py-3.5 pointer-events-none">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium font-mono text-white truncate">
              {host.slug}
            </span>
            {host.annotations.includes("TEMPORARY") && (
              <Badge variant="annotationTemporary">Temporary</Badge>
            )}
            {isReadOnly && (
              <Badge variant="annotationReadOnly">Read Only</Badge>
            )}
            <HostConflictBadge
              annotations={host.annotations}
              className="relative z-10 pointer-events-auto"
            />
          </div>
          {host.name && (
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              {host.name}
            </p>
          )}
          {host.filePath && (
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs text-muted-foreground">
                {host.filePath}
              </p>
              <CopyButton
                value={host.filePath}
                label="Source file"
                revealOnHover
                className="relative z-10 pointer-events-auto"
              />
            </div>
          )}
          {host.destination ? (
            <div className="flex items-center gap-1.5 font-mono text-xs mt-1.5 text-muted-foreground">
              <span className="truncate">{host.source}</span>
              <ArrowRightIcon className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{host.destination}</span>
            </div>
          ) : (
            <div className="font-mono text-xs mt-1.5 text-muted-foreground">
              <span className="truncate">{host.source}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 pointer-events-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-[#444] hover:text-[#888] hover:bg-transparent focus-visible:text-[#888]"
                  aria-label={`Actions for ${host.slug}`}
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isReadOnly ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(host.id)}>
                    <PencilIcon aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(host)}
                  >
                    <TrashIcon aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onEdit(host.id)}>
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
