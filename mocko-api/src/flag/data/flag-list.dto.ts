import { FlagKeyDto } from "./flag-key.dto";

export class FlagListDto {
    constructor(
        public readonly flagKeys: FlagKeyDto[],
        public readonly isTruncated: boolean,
    ) { }
}
