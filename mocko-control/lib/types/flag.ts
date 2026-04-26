export const FLAG_TYPES = ["PREFIX", "FLAG"] as const;
export type FlagType = (typeof FLAG_TYPES)[number];

export type FlagKey = {
  type: FlagType;
  name: string;
  count?: number;
  matchCount?: number;
};
