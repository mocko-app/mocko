import * as Joi from 'joi';

export type MockResponse = {
    code: number,
    delay?: number,
    body: string,
    headers: Record<string, string>
};

export type MockDefinition = {
    id?: string,
    method: string,
    path: string,
    parse: boolean,
    host?: string,
    response: MockResponse
};

export type Host = {
    name: string,
    source: string,
    destination: string,
};

export type MockOptions = {
    mocks: MockDefinition[],
    hosts: Host[],
    data?: Record<string, any>,
};

function merge(array: Record<string, any[]>[]): Record<string, any[]> {
    const output = {};

    for(const obj of array) {
        for(const key in obj) {
            output[key] = output[key] ? [...output[key], ...obj[key]] : obj[key];
        }
    }

    return output;
}

const definitionSchema = Joi.object({
    method: Joi.string().uppercase().regex(/^([A-Z]+|\*)$/),
    path: Joi.string(),
    parse: Joi.boolean().default(true),
    host: Joi.string().optional(),
    response: Joi.object({
        code: Joi.number().min(200).max(599).label("status"),
        delay: Joi.number().optional().min(0).max(300000).label("delay"),
        body: Joi.string().allow('').label("body"),
        headers: Joi.object().pattern(Joi.string(), Joi.string()).label("headers"),
    }),
});

const definitionFromConfig = ([req, res]: [string, any]): MockDefinition => {
    const [rawMethod, ...pathParts] = req.split(" ");
    const method = rawMethod.toUpperCase();
    const path = pathParts.join(" ");
    const headers = res?.headers?.[0] || {};
    const code = res?.status || (method === 'POST' ? 201 : 200);
    const host = res?.host;
    const parse = res?.parse;

    const definition = {
        method, path, host, parse,
        response: {
            code,
            delay: res?.delay,
            body: res?.body || "",
            headers: headers,
        },
    };

    const validation = definitionSchema.validate(definition, { convert: true });
    if(validation.error) {
        throw new Error(`On mock '${req}', ${validation.error.message}`);
    }

    return validation.value;
};

const hostSchema = Joi.object({
    name: Joi.string().required(),
    source: Joi.string().hostname().required(),
    destination: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
});

const hostFromConfig = (name: string, data: any): Host => {
    const host = {
        name,
        source: data?.[0]?.source,
        destination: data?.[0]?.destination,
    };

    const validation = hostSchema.validate(host);
    if(validation.error) {
        throw new Error(`On host '${name}', ${validation.error.message}`);
    }

    return validation.value;
};

export const optionsFromConfig = (config: any): MockOptions => {
    const mocks = Object.entries(merge(config.mock || []))
        .flatMap(([req, resList]) => resList.map(res => [req, res]))
        .map(definitionFromConfig);

    const data = config.data && Object.entries(merge(config.data))
        .map(([key, values]) => ({key, value: merge(values)}))
        .reduce((acc, {key, value}) => ({ ...acc, [key]: value}), {});

    const hosts = Object.entries(merge(config.host || []))
        .map(([name, data]) => hostFromConfig(name, data));

    return { mocks, data, hosts };
};
