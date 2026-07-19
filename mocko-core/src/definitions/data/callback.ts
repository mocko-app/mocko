import * as Joi from 'joi';
import { parse } from 'bigodon';

export const CALLBACK_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
export type CallbackHttpMethod = typeof CALLBACK_METHODS[number];
export type CallbackSource = 'FILE' | 'DEPLOYED';

export type Callback = {
    slug: string,
    name?: string,
    source?: CallbackSource,
    filePath?: string,
    method: CallbackHttpMethod,
    host?: string,
    path?: string,
    url?: string,
    delay: number,
    headers: Record<string, string>,
    body?: string,
};

const callbackSchema = Joi.object({
    slug: Joi.string().required(),
    name: Joi.string().allow('').optional(),
    source: Joi.string().valid('FILE', 'DEPLOYED').optional(),
    filePath: Joi.string().optional(),
    method: Joi.string().valid(...CALLBACK_METHODS).default('POST'),
    host: Joi.string().optional(),
    path: Joi.string().optional(),
    url: Joi.string().pattern(/^https?:\/\//).optional().messages({
        'string.pattern.base': "\"url\" must be an absolute http:// or https:// URL",
    }),
    delay: Joi.number().integer().min(0).default(0).label('delay'),
    headers: Joi.object().pattern(Joi.string(), Joi.string()).default({}).label('headers'),
    body: Joi.string().allow('').optional().label('body'),
})
    .xor('host', 'url')
    .and('host', 'path')
    .messages({
        'object.xor': "must target either a host or an absolute url, not both",
        'object.missing': "must target either a host (with a path) or an absolute url",
        'object.and': "'host' and 'path' must be set together",
    });

export function validateCallback(callback: any): Callback {
    const validation = callbackSchema.validate(callback, { convert: true });
    if(validation.error) {
        throw new Error(validation.error.message);
    }

    const value: Callback = validation.value;
    assertTemplateParses('path', value.path);
    assertTemplateParses('url', value.url);
    assertTemplateParses('body', value.body);
    for(const [key, headerValue] of Object.entries(value.headers)) {
        assertTemplateParses(`header '${key}'`, headerValue);
    }

    return value;
}

function assertTemplateParses(field: string, template?: string): void {
    if(typeof template === 'undefined') {
        return;
    }

    try {
        parse(template);
    } catch(e) {
        const message = e instanceof Error ? e.message : String(e);
        throw new Error(`invalid template in ${field}: ${message}`);
    }
}

export function callbackFromConfig(slug: string, data: any): Callback {
    const attrs = data?.[0];
    const callback = {
        slug,
        name: typeof attrs?.name === 'string' ? attrs.name.trim() || undefined : attrs?.name,
        method: typeof attrs?.method === 'string' ? attrs.method.toUpperCase() : attrs?.method,
        host: attrs?.host,
        path: attrs?.path,
        url: attrs?.url,
        delay: attrs?.delay,
        headers: attrs?.headers?.[0],
        body: attrs?.body,
    };

    try {
        return validateCallback(callback);
    } catch(error) {
        throw new Error(`On callback '${slug}', ${error.message}`);
    }
}
