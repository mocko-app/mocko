import * as Hapi from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import * as Joi from 'joi';
import { Provider } from "../../utils/decorators/provider";
import { firstString } from "../../utils/utils";
import { DeployService } from "../deploy/deploy.service";
import { CallbackService } from "./callback.service";
import { CoreCallbackDto } from "./data/core-callback.dto";
import { PendingCallbackDto } from "./data/pending-callback.dto";

type FirePayload = {
    payload?: unknown,
    delay?: number,
};

const fireSchema = Joi.object({
    payload: Joi.any().optional(),
    delay: Joi.number().integer().min(0).optional(),
});

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

    async listPending(request: Hapi.Request): Promise<PendingCallbackDto[]> {
        this.deployService.authorizeManagement(request.headers.authorization);
        return await this.service.listPending();
    }

    async fire(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> {
        this.deployService.authorizeManagement(request.headers.authorization);
        const slug = decodeURIComponent(firstString(request.params['slug']));
        const { payload, delay } = this.parseFirePayload(request.payload);

        const pending = await this.service.fire(slug, payload ?? null, delay ?? 0);
        return h.response(pending as unknown as object).code(202);
    }

    async firePending(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> {
        this.deployService.authorizeManagement(request.headers.authorization);
        const id = decodeURIComponent(firstString(request.params['id']));

        await this.service.firePending(id);
        return h.response().code(202);
    }

    async cancelPending(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> {
        this.deployService.authorizeManagement(request.headers.authorization);
        const id = decodeURIComponent(firstString(request.params['id']));

        await this.service.cancelPending(id);
        return h.response().code(204);
    }

    async clearPending(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> {
        this.deployService.authorizeManagement(request.headers.authorization);

        await this.service.clearPending();
        return h.response().code(204);
    }

    private parseFirePayload(payload: unknown): FirePayload {
        const validation = fireSchema.validate(payload ?? {}, { stripUnknown: true });
        if(validation.error) {
            throw Boom.badRequest(validation.error.message);
        }

        return validation.value;
    }
}
