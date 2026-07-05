import Link from "next/link";
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
      className={cn("mb-7 text-[15px] leading-[1.75] text-fg-2", className)}
      {...props}
    />
  );
}

export function DocsH3({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "mb-2.5 mt-8 text-[16px] font-semibold tracking-[-0.01em] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DocsUl({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn(
        "mb-4 space-y-1.5 text-[14px] leading-7 text-fg-2",
        className,
      )}
      {...props}
    />
  );
}

export function DocsLink({
  className,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "underline underline-offset-4 transition-colors hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function ScreenshotPlaceholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-center justify-center rounded-lg border border-dashed border-border bg-card/40 px-5 py-10 text-[13px] text-muted-foreground",
        className,
      )}
    >
      Screenshot placeholder: {label}
    </div>
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
