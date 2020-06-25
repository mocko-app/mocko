import {Controller, Get} from '@nestjs/common';
import {HealthService} from "./health.service";

@Controller('health')
export class HealthController {
    constructor(
        private readonly service: HealthService,
    ) { }

    @Get()
    async healthCheck(): Promise<void> {
        await this.service.healthCheck();
    }
}
