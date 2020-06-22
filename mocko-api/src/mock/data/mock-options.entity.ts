import {Mock} from "./mock.entity";

export class MockOptions {
    constructor(
        public readonly mocks: Mock[],
    ) { }
}
