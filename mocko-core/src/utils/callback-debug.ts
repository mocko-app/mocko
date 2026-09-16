import { createHash } from 'crypto';
import { Callback } from '../definitions/data/callback';

export function callbackDebugInfo(callback: Callback) {
    return {
        slug: callback.slug,
        name: callback.name,
        source: callback.source,
        filePath: callback.filePath,
        method: callback.method,
        host: callback.host,
        path: callback.path,
        url: callback.url,
        delay: callback.delay,
        bodySha256: typeof callback.body === 'string'
            ? createHash('sha256').update(callback.body).digest('hex')
            : null,
    };
}
