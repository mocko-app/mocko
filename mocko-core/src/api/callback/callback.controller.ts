import * as Hapi from '@hapi/hapi';
import { Provider } from "../../utils/decorators/provider";
import { DeployService } from "../deploy/deploy.service";
import { CallbackService } from "./callback.service";
import { CoreCallbackDto } from "./data/core-callback.dto";

@Provider()
export class CallbackController {
    constructor(
        private readonly service: CallbackService,
        private readonly deployService: DeployService,
    ) { }

    async listCallbacks(request: Hapi.Request): Promise<CoreCallbackDto[]> {
        this.deployService.authorizeManagement(request.headers.authorization);
        return await this.service.listCallbacks();
    }
}
