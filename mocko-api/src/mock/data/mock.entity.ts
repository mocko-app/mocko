import {HttpMethod} from "./http-method";
import {CreateMockRequestDto} from "./create-mock-request.dto";
import {v4 as uuidv4} from 'uuid';
import { MockFailure } from "./mock-failure";

export class Response {
    constructor(
        public readonly code: number,
        public readonly body: string,
        public readonly headers: Record<string, string>,
    ) { }
}

export class Mock {
    private constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly method: HttpMethod,
        public readonly path: string,
        public readonly response: Response,
        public isEnabled: boolean,
        public failure?: MockFailure,
    ) {
        this.isEnabled = isEnabled ?? true;
        if(!path.startsWith('/')) {
            this.path = `/${path}`;
        }
    }

    static ofDto(dto: CreateMockRequestDto): Mock {
        const response = new Response(dto.response.code, dto.response.body, dto.response.headers);
        return new Mock(uuidv4(), dto.name, dto.method, dto.path, response, true);
    }

    static ofIdAndDto(id: string, dto: CreateMockRequestDto): Mock {
        const response = new Response(dto.response.code, dto.response.body, dto.response.headers);
        return new Mock(id, dto.name, dto.method, dto.path, response, true);
    }

    static ofEntity(entity: Mock): Mock {
        return new Mock(entity.id, entity.name, entity.method, entity.path,
            entity.response, entity.isEnabled);
    }
}
