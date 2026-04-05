import * as Boom from "@hapi/boom";
import * as Hapi from '@hapi/hapi';
import { Provider } from "../../utils/decorators/provider";
import { validateDefinition } from "../../definitions/data/mocko-definition";
import { tryCatchSync } from "../../utils/utils";
import { DeployService } from "./deploy.service";

@Provider()
export class DeployController {
    constructor(
        private readonly service: DeployService,
    ) { }

    async deploy(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        this.service.authorize(request.headers.authorization);

        const [definition, error] = tryCatchSync(() => validateDefinition(request.payload));
        if(error) {
            throw Boom.badRequest(error.message);
        }

        await this.service.deploy(definition);

        return h.response().code(204);
    }
}
