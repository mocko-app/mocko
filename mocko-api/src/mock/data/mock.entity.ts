import {HttpMethod} from "./http-method";
import {CreateMockRequestDto} from "./create-mock-request.dto";
import {v4 as uuidv4} from 'node-uuid';

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
        public readonly name: string,
        public readonly method: HttpMethod,
        public readonly path: string,
        public readonly response: Response,
    ) { }

    static ofDto(dto: CreateMockRequestDto): Mock {
        const response = new Response(dto.response.code, dto.response.body, dto.response.headers);
        return new Mock(uuidv4(), dto.name, dto.method, dto.path, response);
    }

    static ofIdAndDto(id: string, dto: CreateMockRequestDto): Mock {
        const response = new Response(dto.response.code, dto.response.body, dto.response.headers);
        return new Mock(id, dto.name, dto.method, dto.path, response);
    }
}
