export enum FlagKeyType {
    PREFIX = 'PREFIX',
    FLAG = 'FLAG',
};

export class FlagKeyDto {
    constructor(
        public readonly type: FlagKeyType,
        public readonly name: string,
    ) { }
}
