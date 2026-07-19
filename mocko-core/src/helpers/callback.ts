import { MockoExecution } from "../api/mock/mock.handler";
import { DefinitionProvider } from "src/definitions/definition.provider";

export const callback = (definitionProvider: DefinitionProvider) => async function (this: MockoExecution, slug: unknown, payload?: unknown): Promise<void> {
    if(typeof slug !== 'string' || !slug.length) {
        throw new TypeError('Callback slug must be a non-empty string');
    }

    const definitions = await definitionProvider.getDefinitions();
    const definition = definitions.callbacks
        .find((item) => item.slug === slug);

    if(!definition) {
        throw new Error(`No callback found with slug '${slug}'`);
    }

    if(definition.host) {
        const hostSlug = definition.host.toLowerCase();
        const host = definitions.hosts
            .find((item) => item.slug.toLowerCase() === hostSlug);

        if(!host?.destination) {
            throw new Error(`Callback '${slug}' references host '${definition.host}' which does not exist or has no destination`);
        }
    }

    assertSerializable(slug, payload);
    const delay = resolveDelay(this.namedParams.delay, definition.delay);

    this.data.callbacks.push({ slug, payload, delay });
};

function assertSerializable(slug: string, payload: unknown): void {
    try {
        JSON.stringify(payload);
    } catch {
        throw new TypeError(`Callback '${slug}' payload must be JSON-serializable`);
    }
}

function resolveDelay(override: unknown, stanzaDelay: number): number {
    if(typeof override === 'undefined' || override === null) {
        return stanzaDelay;
    }

    const delay = typeof override === 'string' ? parseInt(override, 10) : override;
    if(typeof delay !== 'number' || isNaN(delay) || delay < 0) {
        throw new TypeError('Callback delay must be a non-negative number');
    }

    return delay;
}
