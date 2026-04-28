"use client";

import Link from "next/link";
import {
  ChevronRightIcon,
  FlagIcon,
  FolderIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FlagKeyDto } from "@/lib/types/flag-dtos";

type FolderItemProps = {
  item: FlagKeyDto;
  href: string;
  isFiltering: boolean;
  isTruncated: boolean;
};

function formatFolderCount(
  item: FlagKeyDto,
  isFiltering: boolean,
  isTruncated: boolean,
) {
  if (typeof item.count !== "number") {
    return null;
  }

  if (isFiltering) {
    const matchCount = item.matchCount ?? item.count;
    const suffix = isTruncated ? "+" : "";
    const matchLabel = matchCount === 1 ? "match" : "matches";
    return `${matchCount}${suffix} ${matchLabel} · ${item.count}${suffix} total`;
  }

  if (isTruncated) {
    const flagLabel = item.count === 1 ? "flag" : "flags";
    return `At least ${item.count} ${flagLabel}`;
  }

  const flagLabel = item.count === 1 ? "flag" : "flags";
  return `${item.count} ${flagLabel}`;
}

export function FolderItem({
  item,
  href,
  isFiltering,
  isTruncated,
}: FolderItemProps) {
  const countLabel = formatFolderCount(item, isFiltering, isTruncated);

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-[#252528] hover:bg-card/80"
      aria-label={`Open folder ${item.name}`}
    >
      <FolderIcon
        className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
        aria-hidden="true"
      />
      <span className="flex-1 text-sm font-medium text-white truncate font-mono">
        {item.name}
      </span>
      {countLabel && (
        <span className="text-xs text-muted-foreground shrink-0">
          {countLabel}
        </span>
      )}
      <ChevronRightIcon
        className="size-4 shrink-0 text-[#444] group-hover:text-muted-foreground transition-colors"
        aria-hidden="true"
      />
    </Link>
  );
}

type FlagItemProps = {
  item: FlagKeyDto;
  flagKey: string;
  onEdit: (key: string) => void;
  onDelete: (flagKey: string) => void;
};

export function FlagItem({ item, flagKey, onEdit, onDelete }: FlagItemProps) {
  return (
    <div
      className="group relative flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-[#252528]"
      role="listitem"
      aria-label={`Flag: ${item.name}`}
    >
      <Link
        href={`/flags/${flagKey}`}
        className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        aria-label={`Open flag ${item.name}`}
      />
      <FlagIcon
        className="size-4 shrink-0 text-primary/70"
        aria-hidden="true"
      />
      <span className="flex-1 text-sm font-medium text-white truncate font-mono relative z-10 pointer-events-none">
        {item.name}
      </span>
      <div className="relative z-10 pointer-events-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-[#444] hover:text-[#888] hover:bg-transparent focus-visible:text-[#888]"
                aria-label={`Actions for ${item.name}`}
              />
            }
          >
            <MoreHorizontalIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(flagKey)}>
              <PencilIcon aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(flagKey)}
            >
              <TrashIcon aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
