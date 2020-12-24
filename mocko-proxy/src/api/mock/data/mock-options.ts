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
    response: MockResponse
};

export type MockOptions = {
    mocks: MockDefinition[],
    data?: Record<string, any>,
};

const merge = (array: Record<string, any>[]): Record<string, any> =>
    array.reduce((acc, v) => ({ ...acc, ...v }), {});

const definitionSchema = Joi.object({
    method: Joi.string().uppercase().regex(/^([A-Z]+|\*)$/),
    path: Joi.string(),
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
    const headers = res?.[0]?.headers?.[0] || {};
    const code = res?.[0]?.status || (method === 'POST' ? 201 : 200);

    const definition = {
        method, path,
        response: {
            code,
            delay: res?.[0]?.delay,
            body: res?.[0]?.body || "",
            headers: headers,
        },
    };

    const validation = definitionSchema.validate(definition, { convert: true });
    if(validation.error) {
        throw new Error(`On mock '${req}', ${validation.error.message}`);
    }

    return validation.value;
};

export const optionsFromConfig = (config: any): MockOptions => {
    const mocks = Object.entries(merge(config.mock || []))
        .map(definitionFromConfig);

    const data = config.data && Object.entries(merge(config.data))
        .map(([key, values]) => ({key, value: merge(values)}))
        .reduce((acc, {key, value}) => ({ ...acc, [key]: value}), {});

    return { mocks, data };
};
