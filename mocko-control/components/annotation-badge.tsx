"use client";

import { AlertTriangleIcon, type LucideIcon } from "lucide-react";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VariantProps } from "class-variance-authority";
import type { DisplayMockAnnotation } from "@/lib/types/mock";

export type AnnotationBadgeKind = DisplayMockAnnotation | "DISABLED";

type AnnotationMeta = {
  variant: VariantProps<typeof badgeVariants>["variant"];
  label: string;
  icon?: LucideIcon;
  tooltip: string;
};

const ANNOTATION_META: Record<AnnotationBadgeKind, AnnotationMeta> = {
  TEMPORARY: {
    variant: "annotationTemporary",
    label: "Temporary",
    tooltip:
      "Created through the UI without a persistent store. It will be lost when Mocko restarts.",
  },
  READ_ONLY: {
    variant: "annotationReadOnly",
    label: "Read Only",
    tooltip:
      "Loaded from a file, so it can't be edited in the UI. Edit the file, or duplicate it to override.",
  },
  DISABLED: {
    variant: "annotationDisabled",
    label: "Disabled",
    tooltip: "Turned off. It won't match requests until you enable it again.",
  },
  SHADOWED: {
    variant: "annotationShadowed",
    label: "Shadowed",
    tooltip:
      "A higher-priority mock matches the same requests, so this one never responds.",
  },
  CONFLICT: {
    variant: "annotationConflict",
    label: "Conflict",
    icon: AlertTriangleIcon,
    tooltip:
      "Another active mock shares the same method and path, so which one responds is ambiguous.",
  },
  INVALID_TEMPLATE: {
    variant: "annotationInvalidTemplate",
    label: "Invalid Template",
    icon: AlertTriangleIcon,
    tooltip:
      "The response body isn't a valid template, so this mock errors instead of responding.",
  },
};

export const AnnotationBadge: React.FC<{
  annotation: AnnotationBadgeKind;
  className?: string;
}> = ({ annotation, className }) => {
  const meta = ANNOTATION_META[annotation];
  const Icon = meta.icon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge variant={meta.variant} className={className}>
            {Icon && <Icon aria-hidden="true" />}
            {meta.label}
          </Badge>
        }
      />
      <TooltipContent>{meta.tooltip}</TooltipContent>
    </Tooltip>
  );
};
