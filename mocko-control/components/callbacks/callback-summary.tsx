import Link from "next/link";
import type { CallbackMethod } from "@/lib/types/callback";
import type { CallbackSummaryDto } from "@/lib/types/callback-dtos";
import { cn } from "@/lib/utils";

const METHOD_COLORS: Record<CallbackMethod, string> = {
  GET: "text-sky-400",
  POST: "text-emerald-500",
  PUT: "text-amber-400",
  PATCH: "text-violet-400",
  DELETE: "text-red-400",
};

export const CallbackSummary: React.FC<{ callback: CallbackSummaryDto }> = ({
  callback,
}) => {
  return (
    <Link
      href={`/callbacks/${callback.id}`}
      aria-label={`Open ${callback.origin === "FILE" ? "file" : "UI"} callback ${callback.slug}`}
      className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs transition-colors hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <span
        className={cn(
          "shrink-0 font-mono tracking-wider",
          METHOD_COLORS[callback.method],
        )}
      >
        {callback.method}
      </span>
      <span className="shrink-0 font-mono font-medium text-foreground">
        {callback.slug}
      </span>
      {callback.name && (
        <span className="min-w-0 truncate text-foreground">
          {callback.name}
        </span>
      )}
      {callback.filePath && (
        <span className="min-w-0 truncate font-mono text-muted-foreground">
          {callback.filePath}
        </span>
      )}
      <span className="ml-auto shrink-0 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
        {callback.origin === "FILE" ? "File" : "UI"}
      </span>
    </Link>
  );
};
