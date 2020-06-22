import {Mock} from "./mock.entity";
import {HttpMethod} from "./http-method";

export class ListMocksResponseDto {
    constructor(
        public readonly id: string,
        public readonly method: HttpMethod,
        public readonly path: string,
    ) { }

    static ofEntity(entity: Mock): ListMocksResponseDto {
        return new ListMocksResponseDto(entity.id, entity.method, entity.path);
    }
}
