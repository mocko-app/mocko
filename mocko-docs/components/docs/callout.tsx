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
    bg: "bg-sky-500/10",
    iconColor: "text-sky-300",
  },
  warning: {
    icon: AlertTriangleIcon,
    bg: "bg-amber-500/10",
    iconColor: "text-amber-300",
  },
  tip: {
    icon: LightbulbIcon,
    bg: "bg-primary/10",
    iconColor: "text-primary",
  },
  danger: {
    icon: XCircleIcon,
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
  const { icon: Icon, bg, iconColor } = variants[variant];

  return (
    <div
      role="note"
      className={cn(
        "my-4 flex gap-3 rounded-lg px-4 py-3.5 text-[13px] leading-[1.75] text-fg-2",
        bg,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconColor)} aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
