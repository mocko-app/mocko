import Link from "next/link";
import type { HostSummaryDto } from "@/lib/types/host-dtos";

export const HostSummary: React.FC<{ host: HostSummaryDto }> = ({ host }) => {
  return (
    <Link
      href={`/hosts/${host.id}`}
      aria-label={`Open ${host.origin === "FILE" ? "file" : "UI"} host ${host.slug}`}
      className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs transition-colors hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <span className="shrink-0 font-mono font-medium text-foreground">
        {host.slug}
      </span>
      {host.name && (
        <span className="min-w-0 truncate text-foreground">{host.name}</span>
      )}
      <span className="min-w-0 truncate font-mono text-muted-foreground">
        {host.filePath ?? host.source}
      </span>
      <span className="ml-auto shrink-0 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
        {host.origin === "FILE" ? "File" : "UI"}
      </span>
    </Link>
  );
};
