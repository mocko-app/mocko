import { AlertTriangleIcon, InfoIcon } from "lucide-react";

type CalloutProps = {
  title: string;
  message: string;
  variant?: "warning" | "info";
};

export function Callout({ title, message, variant = "warning" }: CalloutProps) {
  const isInfo = variant === "info";

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
        <div className="min-w-0">
          <p
            className={
              isInfo
                ? "text-sm font-medium text-sky-100"
                : "text-sm font-medium text-amber-100"
            }
          >
            {title}
          </p>
          <p
            className={
              isInfo
                ? "mt-0.5 text-xs text-sky-200/90"
                : "mt-0.5 text-xs text-amber-200/90"
            }
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
