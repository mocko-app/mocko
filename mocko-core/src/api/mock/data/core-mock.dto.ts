import { Mock } from "../../../definitions/data/mock";
import { MockFailure } from "./mock-failure";

type CoreMockSource = 'FILE' | 'DEPLOYED';

export class CoreMockDto {
    private constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly method: string,
        public readonly path: string,
        public readonly host: string | undefined,
        public readonly filePath: string | undefined,
        public readonly isEnabled: boolean,
        public readonly source: CoreMockSource,
        public readonly labels: string[],
    ) { }

    static ofMock(mock: Mock): CoreMockDto {
        return new CoreMockDto(
            mock.id || `${mock.method}:${mock.path}`,
            mock.name || `${mock.method} ${mock.path}`,
            mock.method,
            mock.path,
            mock.host,
            mock.filePath,
            mock.isEnabled,
            mock.source === 'FILE' ? 'FILE' : 'DEPLOYED',
            mock.labels,
        );
    }
}

export class CoreMockDetailsDto {
    private constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly method: string,
        public readonly path: string,
        public readonly host: string | undefined,
        public readonly filePath: string | undefined,
        public readonly isEnabled: boolean,
        public readonly source: CoreMockSource,
        public readonly labels: string[],
        public readonly response: {
            code: number,
            delay?: number,
            body?: string,
            headers: Record<string, string>,
        },
        public readonly failure: {
            message: string,
            date: string,
        } | null,
    ) { }

    static of(mock: Mock, failure: MockFailure | null): CoreMockDetailsDto {
        const base = CoreMockDto.ofMock(mock);

        return new CoreMockDetailsDto(
            base.id,
            base.name,
            base.method,
            base.path,
            base.host,
            base.filePath,
            base.isEnabled,
            base.source,
            base.labels,
            {
                code: mock.response.code,
                delay: mock.response.delay,
                body: mock.response.body,
                headers: {
                    ...mock.response.headers,
                },
            },
            failure ? {
                message: failure.message,
                date: new Date(failure.date).toISOString(),
            } : null,
        );
    }
}
