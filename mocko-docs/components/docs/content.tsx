import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function DocsH2({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "mb-3 mt-10 text-[20px] font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DocsP({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mb-4 text-[14px] leading-[1.85] text-fg-2", className)}
      {...props}
    />
  );
}

export function DocsCode({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cn(
        "rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[13px] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DocsCodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      className={cn(
        "mb-4 overflow-x-auto rounded-lg border border-border bg-card p-4 font-mono text-[13px] leading-6 text-foreground",
        className,
      )}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
}

export function DocsPage({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pb-16", className)} {...props} />;
}

export function DocsEyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function DocsTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "mb-3.5 text-[33px] font-bold leading-[1.18] tracking-[-0.022em] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DocsLead({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "mb-7 max-w-[510px] text-[15px] leading-[1.75] text-fg-2",
        className,
      )}
      {...props}
    />
  );
}

export function DocsSectionTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "mb-2.5 text-[16px] font-semibold tracking-[-0.01em] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DocsSnippet({ command }: { command: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5 font-mono text-[13px]">
      <div className="flex items-center gap-2.5">
        <span className="select-none font-semibold text-primary">$</span>
        <span className="text-foreground">{command}</span>
      </div>
      <button
        type="button"
        aria-label="Copy to clipboard"
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-border hover:text-fg-2"
      >
        <Copy className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
