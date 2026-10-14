import { AnnotationBadge } from "@/components/annotation-badge";
import type { DisplayMockAnnotation } from "@/lib/types/mock";

export const CallbackConflictBadge: React.FC<{
  annotations: readonly DisplayMockAnnotation[];
  className?: string;
}> = ({ annotations, className }) => {
  if (annotations.includes("SHADOWED")) {
    return (
      <AnnotationBadge
        annotation="SHADOWED"
        tooltip="A UI callback with the same slug takes priority, so this one is ignored."
        className={className}
      />
    );
  }

  if (annotations.includes("CONFLICT")) {
    return (
      <AnnotationBadge
        annotation="CONFLICT"
        tooltip="Another callback shares this slug, so only one of them is used."
        className={className}
      />
    );
  }

  return null;
};
