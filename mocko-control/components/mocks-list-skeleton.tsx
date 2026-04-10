"use client";

const SkeletonRow: React.FC = () => {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3.5">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-4 w-18 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-10 rounded bg-muted animate-pulse" />
            <div className="h-3 w-56 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="h-7 w-7 rounded bg-muted animate-pulse shrink-0" />
      </div>
    </div>
  );
};

export const LabelBarSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      {[16, 20, 14, 18, 12].map((w) => (
        <div
          key={w}
          style={{ width: `${w * 4}px` }}
          className="h-7 rounded-full bg-muted animate-pulse shrink-0"
        />
      ))}
    </div>
  );
};

export const MocksListSkeleton: React.FC = () => {
  return (
    <div
      className="flex flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-label="Loading mocks"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </div>
  );
};
