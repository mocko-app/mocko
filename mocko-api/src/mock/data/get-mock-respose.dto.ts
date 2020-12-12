import {Mock} from "./mock.entity";
import {HttpMethod} from "./http-method";
import {ResponseDto} from "./response.dto";

export class GetMockResponseDto {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly method: HttpMethod,
        public readonly path: string,
        public readonly response: ResponseDto,
    ) { }

    static ofEntity(entity: Mock): GetMockResponseDto {
        return new GetMockResponseDto(entity.id, entity.name, entity.method, entity.path, entity.response);
    }
}
