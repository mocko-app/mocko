import type { FlagKey, FlagSource, FlagType } from "@/lib/types/flag";

export class FlagKeyDto {
  constructor(
    public readonly type: FlagType,
    public readonly name: string,
    public readonly count?: number,
    public readonly matchCount?: number,
  ) {}
}

export class FlagListDto {
  constructor(
    public readonly flagKeys: FlagKey[],
    public readonly isTruncated: boolean,
    public readonly count?: number,
    public readonly matchCount?: number,
  ) {}
}

export class FlagDto {
  constructor(
    public readonly value: string,
    public readonly mockUpdatedAt?: string,
    public readonly controlUpdatedAt?: string,
    public readonly sdkUpdatedAt?: string,
  ) {}
}

export type PutFlagDto = {
  value: string;
  source: FlagSource;
};
