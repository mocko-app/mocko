import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put} from '@nestjs/common';
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

    @Put(':id')
    async update(@Param('id') id: string,
                 @Body() body: CreateMockRequestDto): Promise<ListMocksResponseDto> {
        const mock = await this.service.update(id, body);
        return ListMocksResponseDto.ofEntity(mock);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteOne(@Param('id') id: string): Promise<void> {
        await this.service.deleteOne(id);
    }

    @Put(':id/enable')
    @HttpCode(HttpStatus.NO_CONTENT)
    async enable(@Param('id') id: string): Promise<void> {
        await this.service.setEnabled(id, true);
    }

    @Put(':id/disable')
    @HttpCode(HttpStatus.NO_CONTENT)
    async disable(@Param('id') id: string): Promise<void> {
        await this.service.setEnabled(id, false);
    }
}
