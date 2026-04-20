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
    format?: string,
    host?: string,
    labels: string[],
    response: MockResponse
};

const mockSchema = Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().optional(),
    source: Joi.string().valid('FILE', 'DEPLOYED').optional(),
    filePath: Joi.string().optional(),
    isEnabled: Joi.boolean().default(true),
    labels: Joi.array().items(Joi.string()).optional().default([]),
    method: Joi.string().valid(...MOCK_METHODS),
    path: Joi.string(),
    parse: Joi.boolean().default(true),
    format: Joi.string().valid('json', 'html', 'text', 'xml', 'javascript', 'css').optional(),
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

    assertFormatDoesNotConflictWithContentType(validation.value);
    return validation.value;
}

function assertFormatDoesNotConflictWithContentType(mock: Mock): void {
    if(!mock.format) {
        return;
    }

    const hasContentType = Object.keys(mock.response.headers || {})
        .some((key) => key.toLowerCase() === 'content-type');
    if(hasContentType) {
        throw new Error("cannot use both 'format' and an explicit Content-Type header");
    }
}

export function mockFromConfig(req: string, res: any): Mock {
    const [rawMethod, ...pathParts] = req.split(" ");
    const method = rawMethod.toUpperCase();
    const path = pathParts.join(" ");
    const headers = res?.headers?.[0] || {};
    const code = res?.status || (method === 'POST' ? 201 : 200);
    const host = res?.host;
    const parse = res?.parse;
    const format = res?.format;
    const name = res?.name?.trim() || undefined;
    const isEnabled = res?.enabled;
    const labels = res?.labels;

    const definition = {
        name, method, path, host, parse, format, isEnabled, labels,
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
