export type ConflictRole = "active" | "shadowed" | "conflict";

export type ConflictOrigin = "FILE" | "UI";

export type ConflictDto<TSummary> = {
  role: ConflictRole;
  related: TSummary[];
};
