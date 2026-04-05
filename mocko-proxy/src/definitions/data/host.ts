import * as Joi from 'joi';

export type Host = {
    name: string,
    source: string,
    destination: string,
};

const hostSchema = Joi.object({
    name: Joi.string().required(),
    source: Joi.string().hostname().required(),
    destination: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
});

export function validateHost(host: Host): Host {
    const validation = hostSchema.validate(host);
    if(validation.error) {
        throw new Error(validation.error.message);
    }

    return validation.value;
}

export function hostFromConfig(name: string, data: any): Host {
    const host = {
        name,
        source: data?.[0]?.source,
        destination: data?.[0]?.destination,
    };

    try {
        return validateHost(host);
    } catch(error) {
        throw new Error(`On host '${name}', ${error.message}`);
    }
};
