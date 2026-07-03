import Link from "next/link";
import type { HttpMethod } from "@/lib/types/mock";
import type { MockSummaryDto } from "@/lib/types/mock-dtos";
import { cn } from "@/lib/utils";

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-sky-400",
  POST: "text-emerald-500",
  PUT: "text-amber-400",
  PATCH: "text-violet-400",
  DELETE: "text-red-400",
};

export const MockSummary: React.FC<{ mock: MockSummaryDto }> = ({ mock }) => {
  return (
    <Link
      href={`/mocks/${mock.id}`}
      aria-label={`Open ${mock.name}`}
      className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs transition-colors hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <span
        className={cn(
          "shrink-0 font-mono tracking-wider",
          METHOD_COLORS[mock.method],
        )}
      >
        {mock.method}
      </span>
      <span className="min-w-0 truncate font-medium text-foreground">
        {mock.name}
      </span>
      <span className="min-w-0 truncate font-mono text-muted-foreground">
        {mock.filePath ?? mock.path}
      </span>
      <span className="ml-auto shrink-0 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
        {mock.source === "FILE" ? "File" : "UI"}
      </span>
    </Link>
  );
};
