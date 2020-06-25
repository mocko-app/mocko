import {HttpMethod} from "./http-method";
import {ResponseDto} from "./response.dto";
import {IsEnum, IsNotEmpty, IsString, ValidateNested} from "class-validator";
import {Type} from "class-transformer";

export class CreateMockRequestDto {

    @IsEnum(HttpMethod)
    method: HttpMethod;

    @IsNotEmpty()
    @IsString()
    path: string;

    @ValidateNested()
    @Type(() => ResponseDto)
    response: ResponseDto;
}
