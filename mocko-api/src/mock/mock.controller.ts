import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post} from '@nestjs/common';
import {ListMocksResponseDto} from "./data/list-mocks-response.dto";
import {MockService} from "./mock.service";
import {CreateMockRequestDto} from "./data/create-mock-request.dto";
import { GetMockResponseDto } from './data/get-mock-respose.dto';

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

    @Get(':id')
    async getOne(@Param('id') id: string): Promise<GetMockResponseDto> {
        const mock = await this.service.findById(id);
        return GetMockResponseDto.ofEntity(mock);
    }

    @Post()
    async create(@Body() body: CreateMockRequestDto): Promise<ListMocksResponseDto> {
        const mock = await this.service.create(body);
        return ListMocksResponseDto.ofEntity(mock);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteOne(@Param('id') id: string): Promise<void> {
        await this.service.deleteOne(id);
    }
}
