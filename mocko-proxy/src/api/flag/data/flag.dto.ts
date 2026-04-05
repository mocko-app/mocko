type FlagType = 'PREFIX' | 'FLAG';

export class FlagKeyDto {
    private constructor(
        public readonly type: FlagType,
        public readonly name: string,
    ) { }

    static of(type: FlagType, name: string): FlagKeyDto {
        return new FlagKeyDto(type, name);
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
