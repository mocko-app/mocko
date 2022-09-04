import {Mock} from "./mock.entity";
import {HttpMethod} from "./http-method";
import {ResponseDto} from "./response.dto";
import { MockFailureDto } from "./mock-failure.dto";

export class GetMockResponseDto {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly method: HttpMethod,
        public readonly path: string,
        public readonly response: ResponseDto,
        public readonly isEnabled: boolean,
        public readonly failure: MockFailureDto | null,
    ) { }

    static ofEntity(entity: Mock): GetMockResponseDto {
        const failure = entity.failure ? MockFailureDto.ofEntity(entity.failure) : null;
        return new GetMockResponseDto(entity.id, entity.name, entity.method,
                entity.path, entity.response, entity.isEnabled, failure);
    }
}
