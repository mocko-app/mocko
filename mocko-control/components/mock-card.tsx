"use client";

import Link from "next/link";
import {
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
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
import type { MockDto } from "@/lib/types/mock-dtos";
import type { HttpMethod } from "@/lib/types/mock";
import { cn } from "@/lib/utils";

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-sky-400",
  POST: "text-emerald-500",
  PUT: "text-amber-400",
  PATCH: "text-violet-400",
  DELETE: "text-red-400",
};

export const MockCard: React.FC<{
  mock: MockDto;
  onEdit: (id: string) => void;
  onDelete: (mock: MockDto) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
}> = ({ mock, onEdit, onDelete, onToggleEnabled }) => {
  const isReadOnly = mock.annotations.includes("READ_ONLY");
  const href = `/mocks/${mock.id}`;

  return (
    <div
      className="group relative rounded-lg border border-border bg-card transition-colors hover:border-[#252528]"
      role="listitem"
      aria-label={`Mock: ${mock.name}`}
    >
      <Link
        href={href}
        aria-label={`Open ${mock.name}`}
        className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      />
      <div className="relative z-10 flex items-center gap-4 px-4 py-3.5 pointer-events-none">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-white truncate">
              {mock.name}
            </span>
            {mock.annotations.includes("TEMPORARY") && (
              <Badge variant="annotationTemporary">Temporary</Badge>
            )}
            {isReadOnly && (
              <Badge variant="annotationReadOnly">Read Only</Badge>
            )}
          </div>
          {mock.filePath && (
            <p className="truncate text-xs text-muted-foreground">
              {mock.filePath}
            </p>
          )}
          <div className="flex items-center gap-2 font-mono text-xs mt-1.5">
            <span
              className={cn(
                METHOD_COLORS[mock.method],
                "tracking-wider shrink-0",
              )}
            >
              {mock.method}
            </span>
            <span className="text-muted-foreground truncate">{mock.path}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 pointer-events-auto">
          {!mock.isEnabled && (
            <div className="flex items-center gap-1.5" aria-label="Disabled">
              <span
                className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"
                aria-hidden="true"
              />
              <span className="text-xs text-red-400 font-medium">off</span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-[#444] hover:text-[#888] hover:bg-transparent focus-visible:text-[#888]"
                  aria-label={`Actions for ${mock.name}`}
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isReadOnly ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(mock.id)}>
                    <PencilIcon aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onToggleEnabled(mock.id, !mock.isEnabled)}
                  >
                    {mock.isEnabled ? (
                      <ToggleLeftIcon aria-hidden="true" />
                    ) : (
                      <ToggleRightIcon aria-hidden="true" />
                    )}
                    {mock.isEnabled ? "Disable" : "Enable"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(mock)}
                  >
                    <TrashIcon aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onEdit(mock.id)}>
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
