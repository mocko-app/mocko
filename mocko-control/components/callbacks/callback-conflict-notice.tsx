import { CallbackSummary } from "@/components/callbacks/callback-summary";
import {
  ConflictNotice,
  type ConflictNoticeCopy,
} from "@/components/conflict-notice";
import type { CallbackConflictDto } from "@/lib/types/callback-dtos";
import type { ConflictRole } from "@/lib/types/conflict-dtos";

const COPY: Record<ConflictRole, ConflictNoticeCopy> = {
  shadowed: {
    tone: "info",
    title: "Shadowed by another callback",
    message:
      "A UI callback with the same slug takes priority, so this file callback is ignored. Mocks triggering the slug fire the UI callback, and this one can't be fired.",
    relatedLabel: "Shadowed by",
  },
  active: {
    tone: "info",
    title: "Shadowing a file callback",
    message:
      "This callback overrides a read-only file callback with the same slug. The file callback is ignored, and mocks triggering the slug fire this callback.",
    relatedLabel: "Shadows",
  },
  conflict: {
    tone: "warning",
    title: "Conflicting callbacks",
    message:
      "Other callbacks share this slug, so only one of them is used and the rest are ignored. Keep a single callback per slug by removing the extras or changing their slugs.",
    relatedLabel: "Conflicts with",
  },
};

export const CallbackConflictNotice: React.FC<{
  conflict: CallbackConflictDto;
}> = ({ conflict }) => (
  <ConflictNotice
    copy={COPY[conflict.role]}
    related={conflict.related.map((callback) => (
      <CallbackSummary key={callback.id} callback={callback} />
    ))}
  />
);
