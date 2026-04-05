"use client";

const SkeletonRow: React.FC = () => {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 rounded bg-muted animate-pulse shrink-0" />
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
};

export const FlagsListSkeleton: React.FC = () => {
  return (
    <div
      className="flex flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-label="Loading flags"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </div>
  );
};
