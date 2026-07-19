import * as Boom from '@hapi/boom';
import { Service } from "../../utils/decorators/service";
import { DefinitionProvider } from "../../definitions/definition.provider";
import { CallbackDeliveryService } from "./callback-delivery.service";
import { CallbackSchedulerService } from "./callback-scheduler.service";
import { CoreCallbackDto } from "./data/core-callback.dto";
import { PendingCallbackDto } from "./data/pending-callback.dto";

@Service()
export class CallbackService {
    constructor(
        private readonly definitionProvider: DefinitionProvider,
        private readonly scheduler: CallbackSchedulerService,
        private readonly delivery: CallbackDeliveryService,
    ) { }

    async listCallbacks(): Promise<CoreCallbackDto[]> {
        const callbacks = await this.definitionProvider.getFileCallbacks();
        return callbacks.map((callback) => CoreCallbackDto.ofCallback(callback));
    }

    async listPending(): Promise<PendingCallbackDto[]> {
        const pending = await this.scheduler.repository.list();
        return pending.map((entry) => PendingCallbackDto.ofPending(entry));
    }

    async fire(slug: string, payload: unknown, delay: number): Promise<PendingCallbackDto> {
        await this.assertTriggerable(slug);
        const pending = await this.scheduler.schedule({ slug, payload, delay });
        return PendingCallbackDto.ofPending(pending);
    }

    async firePending(id: string): Promise<void> {
        const pending = await this.scheduler.repository.claim(id);
        if(!pending) {
            throw Boom.notFound(`No pending callback found with id '${id}'`);
        }

        void this.delivery.deliver(pending);
    }

    async cancelPending(id: string): Promise<void> {
        const cancelled = await this.scheduler.repository.cancel(id);
        if(!cancelled) {
            throw Boom.notFound(`No pending callback found with id '${id}'`);
        }
    }

    async clearPending(): Promise<void> {
        await this.scheduler.repository.clear();
    }

    private async assertTriggerable(slug: string): Promise<void> {
        const definitions = await this.definitionProvider.getDefinitions();
        const definition = definitions.callbacks
            .find((callback) => callback.slug === slug);

        if(!definition) {
            throw Boom.notFound(`No callback found with slug '${slug}'`);
        }

        if(definition.host) {
            const hostSlug = definition.host.toLowerCase();
            const host = definitions.hosts
                .find((item) => item.slug.toLowerCase() === hostSlug);

            if(!host?.destination) {
                throw Boom.badData(`Callback '${slug}' references host '${definition.host}' which does not exist or has no destination`);
            }
        }
    }
}
