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
    ) { }

    static of(value: string): FlagDto {
        return new FlagDto(value);
    }

    static ofJson(value: any): FlagDto {
        return new FlagDto(JSON.stringify(value));
    }
}
