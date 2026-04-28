import * as Joi from 'joi';

export type Host = {
    slug: string,
    name?: string,
    source: string,
    destination?: string,
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
