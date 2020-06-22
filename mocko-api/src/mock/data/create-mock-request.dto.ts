import {HttpMethod} from "./http-method";
import {ResponseDto} from "./response.dto";
import {IsEnum, IsNotEmpty, IsString, ValidateNested} from "class-validator";

export class CreateMockRequestDto {

    @IsEnum(HttpMethod)
    method: HttpMethod;

    @IsNotEmpty()
    @IsString()
    path: string;

    @ValidateNested()
    response: ResponseDto;
}
