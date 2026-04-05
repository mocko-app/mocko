import { AlertTriangleIcon } from "lucide-react";

type CalloutProps = {
  title: string;
  message: string;
};

export function Callout({ title, message }: CalloutProps) {
  return (
    <div
      className="rounded-lg bg-amber-500/10 px-3 py-2.5"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangleIcon
          className="mt-0.5 size-4 shrink-0 text-amber-300"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-100">{title}</p>
          <p className="mt-0.5 text-xs text-amber-200/90">{message}</p>
        </div>
      </div>
    </div>
  );
}
