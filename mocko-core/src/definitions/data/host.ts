import * as Joi from 'joi';

export type Host = {
    slug: string,
    name?: string,
    source: string,
    destination?: string,
    filePath?: string,
};

const hostSchema = Joi.object({
    slug: Joi.string().required(),
    name: Joi.string().allow('').optional(),
    source: Joi.string().hostname().required(),
    destination: Joi.string().uri({ scheme: ['http', 'https'] }).optional(),
});

export function validateHost(host: Host): Host {
    const validation = hostSchema.validate(host);
    if(validation.error) {
        throw new Error(validation.error.message);
    }

    return validation.value;
}

export function hostFromConfig(slug: string, data: any): Host {
    const host = {
        slug,
        name: data?.[0]?.name,
        source: data?.[0]?.source,
        destination: data?.[0]?.destination,
    };

    try {
        return validateHost(host);
    } catch(error) {
        throw new Error(`On host '${slug}', ${error.message}`);
    }
};

export function findHostBySlug(hosts: Host[], slug: string): Host | undefined {
    const target = slug.toLowerCase();
    return hosts.find((host) => host.slug.toLowerCase() === target);
}

export function findHostBySource(hosts: Host[], source: string): Host | undefined {
    const target = source.toLowerCase();
    return hosts.find((host) => host.source.toLowerCase() === target);
}

export function findHostBySlugOrSource(hosts: Host[], name: string): Host | undefined {
    const target = name.toLowerCase();
    return hosts.find((host) =>
        host.slug.toLowerCase() === target || host.source.toLowerCase() === target);
}

export function resolveVhost(hostName: string | undefined, hosts: Host[]): string | undefined {
    if(!hostName) {
        return undefined;
    }

    const host = findHostBySlugOrSource(hosts, hostName);
    return (host?.source || hostName).toLowerCase();
}
