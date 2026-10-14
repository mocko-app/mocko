import { describe, expect, it } from "vitest";
import {
  computeHostConflicts,
  resolveHostConflict,
} from "@/lib/host/host-conflicts";
import type { Host } from "@/lib/types/host";

let counter = 0;

function uiHost(slug: string): Host {
  counter += 1;
  return {
    id: `host-${counter}`,
    slug,
    source: `${slug}-${counter}.local`,
    annotations: [],
  };
}

function fileHost(slug: string): Host {
  return {
    ...uiHost(slug),
    filePath: "hosts.hcl",
    annotations: ["READ_ONLY"],
  };
}

describe("computeHostConflicts", () => {
  it("pairs one ui host with one file host of the same slug, ignoring case", () => {
    const ui = uiHost("Pay");
    const file = fileHost("pay");
    const hosts = [ui, file, uiHost("other")];

    const conflicts = computeHostConflicts(hosts);

    expect(conflicts.size).toBe(2);
    expect(resolveHostConflict(ui.id, conflicts, hosts)).toEqual({
      role: "active",
      related: [
        {
          id: file.id,
          slug: "pay",
          name: undefined,
          source: file.source,
          destination: undefined,
          filePath: "hosts.hcl",
          origin: "FILE",
        },
      ],
    });
    expect(conflicts.get(file.id)).toEqual({
      role: "shadowed",
      related: [ui.id],
    });
  });

  it("flags every host when a ui host shares its slug with two file hosts", () => {
    const hosts = [uiHost("pay"), fileHost("pay"), fileHost("PAY")];

    const conflicts = computeHostConflicts(hosts);

    for (const host of hosts) {
      expect(conflicts.get(host.id)?.role).toBe("conflict");
      expect(conflicts.get(host.id)?.related).toHaveLength(2);
    }
  });
});
