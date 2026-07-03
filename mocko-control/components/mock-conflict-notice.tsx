import { AlertTriangleIcon, InfoIcon } from "lucide-react";
import { MockSummary } from "@/components/mock-summary";
import type { MockConflictDto } from "@/lib/types/mock-dtos";

type NoticeConfig = {
  tone: "info" | "warning";
  title: string;
  message: string;
  relatedLabel: string;
};

const CONFIG: Record<MockConflictDto["role"], NoticeConfig> = {
  shadowed: {
    tone: "info",
    title: "Shadowed by another mock",
    message:
      "A UI mock with the same method and path takes priority, so this file mock never responds. This is expected when you duplicate a file mock to override it.",
    relatedLabel: "Shadowed by",
  },
  active: {
    tone: "info",
    title: "Shadowing a file mock",
    message:
      "This mock overrides a read-only file mock with the same method and path. The file mock won't respond while this one is enabled.",
    relatedLabel: "Shadows",
  },
  conflict: {
    tone: "warning",
    title: "Conflicting mocks",
    message:
      "Other enabled mocks share this method and path. Which one responds isn't guaranteed, disable the extras so the right one serves.",
    relatedLabel: "Conflicts with",
  },
};

export const MockConflictNotice: React.FC<{ conflict: MockConflictDto }> = ({
  conflict,
}) => {
  const config = CONFIG[conflict.role];
  const isInfo = config.tone === "info";

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
            {config.title}
          </p>
          <p
            className={
              isInfo
                ? "mt-0.5 text-xs text-sky-200/90"
                : "mt-0.5 text-xs text-amber-200/90"
            }
          >
            {config.message}
          </p>
          {conflict.related.length > 0 && (
            <div className="mt-2.5">
              <p
                className={
                  isInfo
                    ? "mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sky-200/70"
                    : "mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-200/70"
                }
              >
                {config.relatedLabel}
              </p>
              <div className="flex flex-col gap-1.5">
                {conflict.related.map((mock) => (
                  <MockSummary key={mock.id} mock={mock} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
