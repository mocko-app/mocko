import { Callback } from "../../../definitions/data/callback";

export class CoreCallbackDto {
    private constructor(
        public readonly slug: string,
        public readonly name: string | undefined,
        public readonly method: string,
        public readonly host: string | undefined,
        public readonly path: string | undefined,
        public readonly url: string | undefined,
        public readonly delay: number,
        public readonly headers: Record<string, string>,
        public readonly body: string | undefined,
        public readonly filePath: string | undefined,
    ) { }

    static ofCallback(callback: Callback): CoreCallbackDto {
        return new CoreCallbackDto(
            callback.slug,
            callback.name,
            callback.method,
            callback.host,
            callback.path,
            callback.url,
            callback.delay,
            callback.headers,
            callback.body,
            callback.filePath,
        );
    }
}
