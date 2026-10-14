import {
  ConflictNotice,
  type ConflictNoticeCopy,
} from "@/components/conflict-notice";
import { HostSummary } from "@/components/host-summary";
import type { ConflictRole } from "@/lib/types/conflict-dtos";
import type { HostConflictDto } from "@/lib/types/host-dtos";

const COPY: Record<ConflictRole, ConflictNoticeCopy> = {
  shadowed: {
    tone: "info",
    title: "Shadowed by another host",
    message:
      "A UI host with the same slug takes priority, so this file host is ignored. Its source isn't routed, and mocks and callbacks using the slug go to the UI host.",
    relatedLabel: "Shadowed by",
  },
  active: {
    tone: "info",
    title: "Shadowing a file host",
    message:
      "This host overrides a read-only file host with the same slug. The file host is ignored, and mocks and callbacks using the slug go to this host.",
    relatedLabel: "Shadows",
  },
  conflict: {
    tone: "warning",
    title: "Conflicting hosts",
    message:
      "Other hosts share this slug, so only one of them is used and the rest are ignored. Keep a single host per slug by removing the extras or changing their slugs.",
    relatedLabel: "Conflicts with",
  },
};

export const HostConflictNotice: React.FC<{ conflict: HostConflictDto }> = ({
  conflict,
}) => (
  <ConflictNotice
    copy={COPY[conflict.role]}
    related={conflict.related.map((host) => (
      <HostSummary key={host.id} host={host} />
    ))}
  />
);
