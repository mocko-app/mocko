import { Flag } from "../flag.repository";

type FlagType = 'PREFIX' | 'FLAG';

export class FlagKeyDto {
    private constructor(
        public readonly type: FlagType,
        public readonly name: string,
        public readonly count?: number,
        public readonly matchCount?: number,
    ) { }

    static of(
        type: FlagType,
        name: string,
        count?: number,
        matchCount?: number,
    ): FlagKeyDto {
        return new FlagKeyDto(type, name, count, matchCount);
    }
}

export class FlagListDto {
    private constructor(
        public readonly flagKeys: FlagKeyDto[],
        public readonly isTruncated: boolean,
    ) { }

    static of(flagKeys: FlagKeyDto[], isTruncated: boolean): FlagListDto {
        return new FlagListDto(flagKeys, isTruncated);
    }
}

export class FlagDto {
    private constructor(
        public readonly value: string,
        public readonly mockUpdatedAt?: string,
        public readonly controlUpdatedAt?: string,
        public readonly sdkUpdatedAt?: string,
    ) { }

    static of(value: string, flag?: Partial<Flag>): FlagDto {
        return new FlagDto(
            value,
            flag?.mockUpdatedAt,
            flag?.controlUpdatedAt,
            flag?.sdkUpdatedAt,
        );
    }

    static ofFlag(flag: Flag): FlagDto {
        return new FlagDto(
            JSON.stringify(flag.value),
            flag.mockUpdatedAt,
            flag.controlUpdatedAt,
            flag.sdkUpdatedAt,
        );
    }
}
