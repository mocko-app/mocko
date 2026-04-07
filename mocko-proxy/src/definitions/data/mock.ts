import * as Joi from 'joi';

export const MOCK_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', '*'] as const;
export type MockHttpMethod = typeof MOCK_METHODS[number];
export type MockSource = 'FILE' | 'DEPLOYED';

export type MockResponse = {
    code: number,
    delay?: number,
    body: string,
    headers: Record<string, string>
};

export type Mock = {
    id?: string,
    name?: string,
    source?: MockSource,
    filePath?: string,
    isEnabled: boolean,
    method: MockHttpMethod,
    path: string,
    parse: boolean,
    host?: string,
    response: MockResponse
};

const mockSchema = Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().optional(),
    source: Joi.string().valid('FILE', 'DEPLOYED').optional(),
    filePath: Joi.string().optional(),
    isEnabled: Joi.boolean().default(true),
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

export function validateMock(mock: any): Mock {
    const validation = mockSchema.validate(mock, { convert: true });
    if(validation.error) {
        throw new Error(validation.error.message);
    }

    return validation.value;
}

export function mockFromConfig(req: string, res: any): Mock {
    const [rawMethod, ...pathParts] = req.split(" ");
    const method = rawMethod.toUpperCase();
    const path = pathParts.join(" ");
    const headers = res?.headers?.[0] || {};
    const code = res?.status || (method === 'POST' ? 201 : 200);
    const host = res?.host;
    const parse = res?.parse;
    const name = res?.name?.trim() || undefined;
    const isEnabled = res?.enabled;

    const definition = {
        name, method, path, host, parse, isEnabled,
        response: {
            code,
            delay: res?.delay,
            body: res?.body || "",
            headers: headers,
        },
    };

    try {
        return validateMock(definition);
    } catch(error) {
        throw new Error(`On mock '${req}', ${error.message}`);
    }
}
