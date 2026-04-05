export const FLAG_TYPES = ["PREFIX", "FLAG"] as const;
export type FlagType = (typeof FLAG_TYPES)[number];

export class FlagKeyDto {
  constructor(
    public readonly type: FlagType,
    public readonly name: string,
  ) {}
}

export class FlagListDto {
  constructor(
    public readonly flagKeys: FlagKeyDto[],
    public readonly isTruncated: boolean,
  ) {}
}

export class FlagDto {
  constructor(public readonly value: string) {}
}

export type CreateFlagDto = {
  key: string;
  value: string;
};

export type PatchFlagDto = {
  value: string;
};
