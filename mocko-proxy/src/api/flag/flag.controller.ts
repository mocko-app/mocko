import * as Boom from "@hapi/boom";
import * as Hapi from "@hapi/hapi";
import * as Joi from "joi";
import { Provider } from "../../utils/decorators/provider";
import { DeployService } from "../deploy/deploy.service";
import { FlagService } from "./flag.service";
import { FlagDto, FlagListDto } from "./data/flag.dto";

const setFlagSchema = Joi.object({
    value: Joi.string().required(),
}).required();

@Provider()
export class FlagController {
    constructor(
        private readonly flagService: FlagService,
        private readonly deployService: DeployService,
    ) { }

    async listFlags(request: Hapi.Request): Promise<FlagListDto> {
        this.deployService.authorize(request.headers.authorization);
        const prefix = String(request.query['prefix'] || '');

        return await this.flagService.listFlags(prefix);
    }

    async putFlag(request: Hapi.Request): Promise<FlagDto> {
        this.deployService.authorize(request.headers.authorization);
        const key = decodeURIComponent(String(request.params['key'] || ''));
        const { value } = this.parseSetPayload(request.payload);
        await this.flagService.setFlag(key, this.parseApiValue(value));
        return FlagDto.of(value);
    }

    async getFlag(request: Hapi.Request): Promise<FlagDto> {
        this.deployService.authorize(request.headers.authorization);
        const key = decodeURIComponent(String(request.params['key'] || ''));
        const exists = await this.flagService.hasFlag(key);
        if(!exists) {
            throw Boom.notFound(`Flag "${key}" was not found`);
        }

        const flag = await this.flagService.getFlag(key);
        return FlagDto.ofJson(flag);
    }

    async deleteFlag(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        this.deployService.authorize(request.headers.authorization);
        const key = decodeURIComponent(String(request.params['key'] || ''));
        await this.flagService.delFlag(key);
        return h.response().code(204);
    }

    private parseSetPayload(payload: unknown): { value: string } {
        const validation = setFlagSchema.validate(payload, {
            abortEarly: false,
            stripUnknown: true,
        });
        if(validation.error) {
            throw Boom.badRequest(validation.error.message);
        }

        return validation.value;
    }

    private parseApiValue(value: string): any {
        try {
            return JSON.parse(value);
        } catch {
            throw Boom.badRequest(
                'Flag value must be valid JSON. If you want to save a string, wrap it in double quotes.',
            );
        }
    }
}
