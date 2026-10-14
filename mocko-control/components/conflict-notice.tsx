import { AlertTriangleIcon, InfoIcon } from "lucide-react";

export type ConflictNoticeCopy = {
  tone: "info" | "warning";
  title: string;
  message: string;
  relatedLabel: string;
};

export const ConflictNotice: React.FC<{
  copy: ConflictNoticeCopy;
  related: React.ReactNode[];
}> = ({ copy, related }) => {
  const isInfo = copy.tone === "info";

  return (
    <div
      className={
        isInfo
          ? "rounded-lg bg-sky-500/10 px-3 py-2.5"
          : "rounded-lg bg-amber-500/10 px-3 py-2.5"
      }
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5">
        {isInfo ? (
          <InfoIcon
            className="mt-0.5 size-4 shrink-0 text-sky-300"
            aria-hidden="true"
          />
        ) : (
          <AlertTriangleIcon
            className="mt-0.5 size-4 shrink-0 text-amber-300"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={
              isInfo
                ? "text-sm font-medium text-sky-100"
                : "text-sm font-medium text-amber-100"
            }
          >
            {copy.title}
          </p>
          <p
            className={
              isInfo
                ? "mt-0.5 text-xs text-sky-200/90"
                : "mt-0.5 text-xs text-amber-200/90"
            }
          >
            {copy.message}
          </p>
          {related.length > 0 && (
            <div className="mt-2.5">
              <p
                className={
                  isInfo
                    ? "mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sky-200/70"
                    : "mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-200/70"
                }
              >
                {copy.relatedLabel}
              </p>
              <div className="flex flex-col gap-1.5">{related}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
