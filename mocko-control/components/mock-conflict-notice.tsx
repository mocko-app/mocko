import {
  ConflictNotice,
  type ConflictNoticeCopy,
} from "@/components/conflict-notice";
import { MockSummary } from "@/components/mock-summary";
import type { ConflictRole } from "@/lib/types/conflict-dtos";
import type { MockConflictDto } from "@/lib/types/mock-dtos";

const COPY: Record<ConflictRole, ConflictNoticeCopy> = {
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
}) => (
  <ConflictNotice
    copy={COPY[conflict.role]}
    related={conflict.related.map((mock) => (
      <MockSummary key={mock.id} mock={mock} />
    ))}
  />
);
