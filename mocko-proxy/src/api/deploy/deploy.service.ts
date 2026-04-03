import * as Boom from "@hapi/boom";
import { Service } from "../../utils/decorators/service";
import { configProvider } from "../../config/config.service";
import { DefinitionProvider } from "../../definitions/definition.provider";
import { MockoDefinition } from "../../definitions/data/mocko-definition";
import { RemapEventBus } from "../../utils/remap-event-bus";

const DEPLOY_ENDPOINT_ENABLED = configProvider.getOptionalBoolean('DEPLOY_ENDPOINT_ENABLED');
const DEPLOY_SECRET = configProvider.getOptional('DEPLOY_SECRET');

@Service()
export class DeployService {
    constructor(
        private readonly definitionProvider: DefinitionProvider,
        private readonly remapEventBus: RemapEventBus,
    ) {
        if(DEPLOY_ENDPOINT_ENABLED && !DEPLOY_SECRET) {
            throw new Error('Missing DEPLOY_SECRET config');
        }
    }

    isEnabled(): boolean {
        return DEPLOY_ENDPOINT_ENABLED === true;
    }

    authorize(authorization?: string): void {
        const token = authorization?.trim();

        if(!token || token !== `Bearer ${DEPLOY_SECRET}`) {
            throw Boom.unauthorized('Invalid deploy token');
        }
    }

    async deploy(definition: MockoDefinition): Promise<void> {
        this.definitionProvider.setDeployDefinition(definition);
        await this.remapEventBus.emit();
    }
}
