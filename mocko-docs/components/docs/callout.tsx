import type { ReactNode } from "react";
import {
  AlertTriangleIcon,
  InfoIcon,
  LightbulbIcon,
  XCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  info: {
    icon: InfoIcon,
    border: "border-l-blue-400",
    bg: "bg-blue-400/10",
    iconColor: "text-blue-400",
  },
  warning: {
    icon: AlertTriangleIcon,
    border: "border-l-amber-500",
    bg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  tip: {
    icon: LightbulbIcon,
    border: "border-l-primary",
    bg: "bg-primary/10",
    iconColor: "text-primary",
  },
  danger: {
    icon: XCircleIcon,
    border: "border-l-destructive",
    bg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
} as const;

export type CalloutVariant = keyof typeof variants;

export function Callout({
  variant,
  children,
  className,
}: {
  variant: CalloutVariant;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, border, bg, iconColor } = variants[variant];

  return (
    <div
      role="note"
      className={cn(
        "my-4 flex gap-3 rounded-r-lg border-l-4 px-4 py-3.5 text-[13px] leading-[1.75] text-fg-2",
        border,
        bg,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconColor)} aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
