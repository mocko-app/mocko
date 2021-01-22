import {IsInt, IsNotEmpty, IsOptional, IsString, Max, Min} from "class-validator";

export class ResponseDto {

    @IsNotEmpty()
    @Min(200)
    @Max(599)
    @IsInt()
    code: number;

    @IsOptional()
    @IsString()
    body: string;

    @IsNotEmpty()
    headers: Record<string, string>;
}