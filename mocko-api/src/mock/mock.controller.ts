import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post} from '@nestjs/common';
import {ListMocksResponseDto} from "./data/list-mocks-response.dto";
import {MockService} from "./mock.service";
import {CreateMockRequestDto} from "./data/create-mock-request.dto";

@Controller('mocks')
export class MockController {
    constructor(
        private readonly service: MockService,
    ) { }

    @Get()
    async listAll(): Promise<ListMocksResponseDto[]> {
        const mocks = await this.service.listAll();
        return mocks.map(ListMocksResponseDto.ofEntity);
    }

    @Post()
    async create(@Body() body: CreateMockRequestDto): Promise<void> {
        await this.service.create(body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteOne(@Param('id') id: string): Promise<void> {
        await this.service.deleteOne(id);
    }
}
