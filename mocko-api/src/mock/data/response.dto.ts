import {IsInt, IsNotEmpty, IsString, Max, Min} from "class-validator";

export class ResponseDto {

    @IsNotEmpty()
    @Min(200)
    @Max(599)
    @IsInt()
    code: number;

    @IsNotEmpty()
    @IsString()
    body: string;

    @IsNotEmpty()
    headers: Record<string, string>;
}