"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const FieldSkeleton: React.FC<{
  labelWidth: string;
  control?: React.ReactNode;
  className?: string;
}> = ({ labelWidth, control, className }) => {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Skeleton className={cn("h-3.5", labelWidth)} />
      {control ?? <Skeleton className="h-8 w-full rounded-lg" />}
    </div>
  );
};

export const MockFormSkeleton: React.FC = () => {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-live="polite"
      aria-label="Loading mock"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="size-9 rounded-lg" />
      </div>

      <div className="flex flex-col gap-4">
        <FieldSkeleton labelWidth="w-12" />
        <FieldSkeleton
          labelWidth="w-14"
          control={<Skeleton className="h-8 w-40 rounded-full" />}
        />

        <div className="flex w-full gap-3">
          <FieldSkeleton labelWidth="w-14" className="w-28 shrink-0" />
          <FieldSkeleton labelWidth="w-10" className="flex-1" />
        </div>

        <FieldSkeleton
          labelWidth="w-20"
          control={<Skeleton className="h-8 w-36 rounded-lg" />}
        />

        <Skeleton className="h-4 w-40" />

        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-7 w-36 rounded-lg" />
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>

      <Skeleton className="h-8 w-32 rounded-lg" />
    </div>
  );
};

export const FlagFormSkeleton: React.FC = () => {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-live="polite"
      aria-label="Loading flag"
    >
      <Skeleton className="h-4 w-48" />

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
        </div>
      </div>

      <FieldSkeleton
        labelWidth="w-10"
        control={<Skeleton className="h-9 w-full rounded-lg" />}
      />

      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-14" />
        <Skeleton className="h-3 w-72" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>

      <Skeleton className="h-8 w-32 rounded-lg" />
    </div>
  );
};

export const CallbackFormSkeleton: React.FC = () => {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-live="polite"
      aria-label="Loading callback"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="size-9 rounded-lg" />
      </div>

      <div className="flex flex-col gap-4">
        <FieldSkeleton
          labelWidth="w-12"
          control={<Skeleton className="h-9 w-full rounded-lg" />}
        />
        <FieldSkeleton labelWidth="w-24" />
        <FieldSkeleton labelWidth="w-16" />
        <FieldSkeleton labelWidth="w-20" />
        <FieldSkeleton
          labelWidth="w-16"
          control={<Skeleton className="h-40 w-full rounded-lg" />}
        />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
};

export const HostFormSkeleton: React.FC = () => {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-live="polite"
      aria-label="Loading host"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="size-9 rounded-lg" />
      </div>

      <div className="flex flex-col gap-4">
        <FieldSkeleton
          labelWidth="w-12"
          control={<Skeleton className="h-9 w-full rounded-lg" />}
        />
        <FieldSkeleton labelWidth="w-24" />
        <FieldSkeleton labelWidth="w-16" />
        <FieldSkeleton labelWidth="w-28" />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
};
