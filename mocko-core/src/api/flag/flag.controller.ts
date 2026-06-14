import * as Boom from "@hapi/boom";
import * as Hapi from "@hapi/hapi";
import * as Joi from "joi";
import { Provider } from "../../utils/decorators/provider";
import { firstString } from "../../utils/utils";
import { DeployService } from "../deploy/deploy.service";
import { FlagService } from "./flag.service";
import { FlagDto, FlagListDto } from "./data/flag.dto";
import { FLAG_SOURCES, FlagSource } from "./flag.repository";

const setFlagSchema = Joi.object({
    value: Joi.string().required(),
    source: Joi.string().valid(...FLAG_SOURCES).required(),
    ttl: Joi.number().positive().optional(),
}).required();

type SetFlagPayload = {
    value: string;
    source: FlagSource;
    ttl?: number;
};

@Provider()
export class FlagController {
    constructor(
        private readonly flagService: FlagService,
        private readonly deployService: DeployService,
    ) { }

    async listFlags(request: Hapi.Request): Promise<FlagListDto> {
        this.deployService.authorizeFlags(request.headers.authorization);
        const prefix = firstString(request.query['prefix']);
        const search = firstString(request.query['q']);

        return await this.flagService.listFlags(prefix, search);
    }

    async putFlag(request: Hapi.Request): Promise<FlagDto> {
        this.deployService.authorizeFlags(request.headers.authorization);
        const key = decodeURIComponent(firstString(request.params['key']));
        this.assertValidKey(key);
        const { value, source, ttl } = this.parseSetPayload(request.payload);
        const flag = await this.flagService.setFlag(
            key,
            this.parseApiValue(value),
            source,
            this.parseApiTtlMillis(ttl),
        );
        return FlagDto.of(value, flag);
    }

    async getFlag(request: Hapi.Request): Promise<FlagDto> {
        this.deployService.authorizeFlags(request.headers.authorization);
        const key = decodeURIComponent(firstString(request.params['key']));
        const flag = await this.flagService.getFlagDetails(key);
        if(!flag) {
            throw Boom.notFound(`Flag "${key}" was not found`);
        }

        return FlagDto.ofFlag(flag);
    }

    async deleteFlag(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        this.deployService.authorizeFlags(request.headers.authorization);
        const key = decodeURIComponent(firstString(request.params['key']));
        await this.flagService.delFlag(key);
        return h.response().code(204);
    }

    private parseSetPayload(payload: unknown): SetFlagPayload {
        const validation = setFlagSchema.validate(payload, {
            abortEarly: false,
            stripUnknown: true,
        });
        if(validation.error) {
            throw Boom.badRequest(validation.error.message);
        }

        return validation.value;
    }

    private parseApiTtlMillis(ttl: number | undefined): number | undefined {
        return typeof ttl === 'undefined' ? undefined : ttl * 1000;
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

    private assertValidKey(key: string): void {
        if(!key.trim()) {
            throw Boom.badRequest('Flag key is required');
        }
        if(key.startsWith(':') || key.endsWith(':') || key.includes('::')) {
            throw Boom.badRequest(
                "Flag key cannot start or end with ':' or contain empty sections like '::'",
            );
        }
    }
}
