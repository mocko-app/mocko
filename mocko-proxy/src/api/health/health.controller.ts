import {Provider} from "../../utils/decorators/provider";
import * as Hapi from '@hapi/hapi';
import {HealthService} from "./health.service";

@Provider()
export class HealthController {
    constructor(
        private readonly service: HealthService,
    ) { }

    async healthCheck(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        await this.service.healthCheck();
        return h.response()
            .code(204);
    }
}
