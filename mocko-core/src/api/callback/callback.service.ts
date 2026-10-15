import * as Boom from '@hapi/boom';
import { Service } from "../../utils/decorators/service";
import { DefinitionProvider } from "../../definitions/definition.provider";
import { findCallbackBySlug } from "../../definitions/data/callback";
import { findHostBySlug } from "../../definitions/data/host";
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
        const pending = await this.scheduler.repository.find(id);
        if(!pending) {
            throw this.pendingNotFound(id);
        }

        await this.assertTriggerable(pending.slug, Boom.badData);
        const claimed = await this.scheduler.repository.claim(id);
        if(!claimed) {
            throw this.pendingNotFound(id);
        }

        void this.delivery.deliver(claimed);
    }

    async holdPending(id: string): Promise<PendingCallbackDto> {
        const held = await this.scheduler.repository.hold(id, Date.now());
        if(held) {
            return PendingCallbackDto.ofPending(held);
        }

        const existing = await this.scheduler.repository.find(id);
        if(existing?.heldAt !== undefined) {
            throw Boom.conflict(`Pending callback '${id}' is already held`);
        }

        throw this.pendingNotFound(id);
    }

    async cancelPending(id: string): Promise<void> {
        const cancelled = await this.scheduler.repository.cancel(id);
        if(!cancelled) {
            throw this.pendingNotFound(id);
        }
    }

    async clearPending(): Promise<void> {
        await this.scheduler.repository.clear();
    }

    private pendingNotFound(id: string): Boom.Boom {
        return Boom.notFound(`No pending callback found with id '${id}'`);
    }

    private async assertTriggerable(
        slug: string,
        missingDefinitionError: (message: string) => Boom.Boom = Boom.notFound,
    ): Promise<void> {
        const definitions = await this.definitionProvider.getDefinitions();
        const definition = findCallbackBySlug(definitions.callbacks, slug);

        if(!definition) {
            throw missingDefinitionError(`No callback found with slug '${slug}'`);
        }

        if(definition.host) {
            const host = findHostBySlug(definitions.hosts, definition.host);

            if(!host?.destination) {
                throw Boom.badData(`Callback '${slug}' references host '${definition.host}' which does not exist or has no destination`);
            }
        }
    }
}
