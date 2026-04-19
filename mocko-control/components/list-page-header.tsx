import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ListPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions: ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function ListPageHeader({
  title,
  description,
  actions,
  titleClassName,
  descriptionClassName,
}: ListPageHeaderProps) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1
          className={cn(
            "truncate text-2xl font-semibold tracking-tight text-white",
            titleClassName,
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "mt-0.5 text-sm text-muted-foreground",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{actions}</div>
    </div>
  );
}
