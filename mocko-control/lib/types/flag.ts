export const FLAG_TYPES = ["PREFIX", "FLAG"] as const;
export type FlagType = (typeof FLAG_TYPES)[number];
export const FLAG_SOURCES = ["MOCK", "CONTROL", "SDK"] as const;
export type FlagSource = (typeof FLAG_SOURCES)[number];

export type FlagKey = {
  type: FlagType;
  name: string;
  count?: number;
  matchCount?: number;
};
