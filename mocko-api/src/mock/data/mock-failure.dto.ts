import { MockFailure } from "./mock-failure";

export class MockFailureDto {
    constructor(
        public readonly message: string,
        public readonly date: Date,
    ) { }

    static ofEntity(entity: MockFailure): MockFailureDto {
        return new MockFailureDto(entity.message, new Date(entity.date));
    }
}
