import * as Boom from "@hapi/boom";
import { Service } from "../../utils/decorators/service";
import { configProvider } from "../../config/config.service";
import { DefinitionProvider } from "../../definitions/definition.provider";
import { MockoDefinition } from "../../definitions/data/mocko-definition";
import { RemapEventBus } from "../../utils/remap-event-bus";
import { firstString } from "../../utils/utils";

const DEPLOY_ENDPOINT_ENABLED = configProvider.getOptionalBoolean('DEPLOY_ENDPOINT_ENABLED');
const DEPLOY_SECRET = configProvider.getOptional('DEPLOY_SECRET');
const MANAGEMENT_AUTH_MODE = getManagementAuthMode();

type ManagementAuthMode = 'none' | 'deploy' | 'all';

@Service()
export class DeployService {
    constructor(
        private readonly definitionProvider: DefinitionProvider,
        private readonly remapEventBus: RemapEventBus,
    ) {
        if(
            DEPLOY_ENDPOINT_ENABLED &&
            this.deployAuthRequired() &&
            !DEPLOY_SECRET
        ) {
            throw new Error('Missing DEPLOY_SECRET config');
        }
        if(this.managementAuthRequired() && !DEPLOY_SECRET) {
            throw new Error('Missing DEPLOY_SECRET config');
        }
    }

    isEnabled(): boolean {
        return DEPLOY_ENDPOINT_ENABLED === true;
    }

    authorizeDeploy(authorization?: string | string[]): void {
        if(!this.deployAuthRequired()) {
            return;
        }

        this.authorize(authorization);
    }

    authorizeManagement(authorization?: string | string[]): void {
        if(!this.authRequired()) {
            return;
        }

        this.authorize(authorization);
    }

    authorizeFlags(authorization?: string | string[]): void {
        if(!this.flagsAuthRequired()) {
            return;
        }

        this.authorize(authorization);
    }

    private deployAuthRequired(): boolean {
        return MANAGEMENT_AUTH_MODE === 'deploy' || MANAGEMENT_AUTH_MODE === 'all';
    }

    private managementAuthRequired(): boolean {
        return MANAGEMENT_AUTH_MODE === 'all';
    }

    private flagsAuthRequired(): boolean {
        return MANAGEMENT_AUTH_MODE === 'all';
    }

    private authRequired(): boolean {
        return MANAGEMENT_AUTH_MODE === 'deploy' || MANAGEMENT_AUTH_MODE === 'all';
    }

    private authorize(authorization?: string | string[]): void {
        const token = firstString(authorization).trim();

        if(!token || token !== `Bearer ${DEPLOY_SECRET}`) {
            throw Boom.unauthorized('Invalid deploy token');
        }
    }

    async deploy(definition: MockoDefinition): Promise<void> {
        this.definitionProvider.setDeployDefinition(definition);
        await this.remapEventBus.emit();
    }
}

function getManagementAuthMode(): ManagementAuthMode {
    const mode = configProvider.getOptional('MANAGEMENT_AUTH_MODE') || 'deploy';
    if(mode === 'none' || mode === 'deploy' || mode === 'all') {
        return mode;
    }

    throw new Error(
        'Invalid MANAGEMENT_AUTH_MODE config. Expected one of: none, deploy, all',
    );
}
