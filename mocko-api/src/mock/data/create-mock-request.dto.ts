import {HttpMethod} from "./http-method";
import {ResponseDto} from "./response.dto";
import {IsEnum, IsNotEmpty, IsString, Length, ValidateNested} from "class-validator";
import {Type} from "class-transformer";

export class CreateMockRequestDto {

    @IsString()
    @Length(1, 42)
    name: string;

    @IsEnum(HttpMethod)
    method: HttpMethod;

    @IsNotEmpty()
    @IsString()
    path: string;

    @ValidateNested()
    @Type(() => ResponseDto)
    response: ResponseDto;
}
