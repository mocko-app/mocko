import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title?: string;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  children,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="px-6 py-12 text-center" role="status">
      {title ? (
        <h2 className="mb-2 text-lg font-medium text-foreground">{title}</h2>
      ) : null}
      <div className="mx-auto max-w-md text-sm text-muted-foreground">
        {children}
      </div>
      {actionHref && actionLabel ? (
        <div className="mt-5">
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={actionHref} />}
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
