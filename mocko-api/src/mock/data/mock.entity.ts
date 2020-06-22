import {HttpMethod} from "./http-method";

export class Response {
    constructor(
        public readonly code: number,
        public readonly body: string,
        public readonly headers: Record<string, string>,
    ) { }
}

export class Mock {
    constructor(
        public readonly id: string,
        public readonly method: HttpMethod,
        public readonly path: string,
        public readonly response: Response,
    ) { }
}
