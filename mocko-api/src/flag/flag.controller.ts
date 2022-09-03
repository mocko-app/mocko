import { Controller, Get, Param, Query } from '@nestjs/common';
import { FlagListDto } from './data/flag-list.dto';
import { FlagDto } from './data/flag.dto';
import { FlagService } from './flag.service';

@Controller('flags')
export class FlagController {
    constructor(
        private readonly service: FlagService,
    ) { }

    @Get()
    async listFlags(@Query('prefix') prefix = ''): Promise<FlagListDto> {
        return await this.service.listFlags(prefix);
    }

    @Get(':flag')
    async getFlag(@Param('flag') flag: string): Promise<FlagDto> {
        const value = await this.service.getFlag(flag);
        return new FlagDto(value);
    }
}
