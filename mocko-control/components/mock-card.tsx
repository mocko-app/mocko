"use client";

import Link from "next/link";
import { AnnotationBadge } from "@/components/annotation-badge";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { MockActionsMenu } from "@/components/mock-actions-menu";
import type { MockDto } from "@/lib/types/mock-dtos";
import type { HttpMethod } from "@/lib/types/mock";
import { cn } from "@/lib/utils";
import { labelStyle } from "@/lib/utils/labels";

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-sky-400",
  POST: "text-emerald-500",
  PUT: "text-amber-400",
  PATCH: "text-violet-400",
  DELETE: "text-red-400",
};

function getHostLabel(host: string | undefined, hostSlugs: readonly string[]) {
  if (!host) {
    return null;
  }

  if (hostSlugs.includes(host)) {
    return `(@${host})`;
  }

  return `(${host})`;
}

export const MockCard: React.FC<{
  mock: MockDto;
  href: string;
  hostSlugs: readonly string[];
  onEdit: (id: string) => void;
  onDelete: (mock: MockDto) => void;
  onDuplicate: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
}> = ({
  mock,
  href,
  hostSlugs,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleEnabled,
}) => {
  const hostLabel = getHostLabel(mock.host, hostSlugs);

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
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-medium text-white truncate">
                {mock.name}
              </span>
              {hostLabel && (
                <span className="font-mono text-xs text-muted-foreground shrink-0">
                  {hostLabel}
                </span>
              )}
            </div>
            {mock.annotations.map((annotation) => (
              <AnnotationBadge
                key={annotation}
                annotation={annotation}
                className="relative z-10 pointer-events-auto"
              />
            ))}
          </div>
          {mock.filePath && (
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs text-muted-foreground">
                {mock.filePath}
              </p>
              <CopyButton
                value={mock.filePath}
                label="Source file"
                revealOnHover
                className="relative z-10 pointer-events-auto"
              />
            </div>
          )}
          {mock.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {mock.labels.map((label) => (
                <span
                  key={label}
                  style={labelStyle(label)}
                  className="inline-flex items-center rounded-full border px-2 py-px text-[10px] font-medium leading-tight"
                >
                  {label}
                </span>
              ))}
            </div>
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
            <CopyButton
              value={mock.path}
              label="Path"
              revealOnHover
              className="relative z-10 pointer-events-auto"
            />
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

          <MockActionsMenu
            mock={mock}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-[#444] hover:text-[#888] hover:bg-transparent focus-visible:text-[#888]"
                aria-label={`Actions for ${mock.name}`}
              />
            }
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={() => onDuplicate(mock.id)}
            onToggleEnabled={onToggleEnabled}
          />
        </div>
      </div>
    </div>
  );
};
