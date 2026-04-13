import type { FlagKey, FlagType } from "@/lib/types/flag";

export class FlagKeyDto {
  constructor(
    public readonly type: FlagType,
    public readonly name: string,
  ) {}
}

export class FlagListDto {
  constructor(
    public readonly flagKeys: FlagKey[],
    public readonly isTruncated: boolean,
  ) {}
}

export class FlagDto {
  constructor(public readonly value: string) {}
}

export type PutFlagDto = {
  value: string;
};
