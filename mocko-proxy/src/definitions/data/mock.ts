import * as Joi from 'joi';

export const MOCK_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', '*'] as const;
export type MockHttpMethod = typeof MOCK_METHODS[number];

export type MockResponse = {
    code: number,
    delay?: number,
    body: string,
    headers: Record<string, string>
};

export type Mock = {
    id?: string,
    method: MockHttpMethod,
    path: string,
    parse: boolean,
    host?: string,
    response: MockResponse
};

const mockSchema = Joi.object({
    method: Joi.string().valid(...MOCK_METHODS),
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

export function mockFromConfig(req: string, res: any): Mock {
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

    const validation = mockSchema.validate(definition, { convert: true });
    if(validation.error) {
        throw new Error(`On mock '${req}', ${validation.error.message}`);
    }

    return validation.value;
}
