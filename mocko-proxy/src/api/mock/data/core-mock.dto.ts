import { Mock } from "../../../definitions/data/mock";
import { MockFailure } from "./mock-failure";

type CoreMockSource = 'FILE' | 'DEPLOYED';

export class CoreMockDto {
    private constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly method: string,
        public readonly path: string,
        public readonly isEnabled: boolean,
        public readonly source: CoreMockSource,
    ) { }

    static ofMock(mock: Mock): CoreMockDto {
        return new CoreMockDto(
            mock.id || `${mock.method}:${mock.path}`,
            mock.name || `${mock.method} ${mock.path}`,
            mock.method,
            mock.path,
            true,
            mock.source === 'FILE' ? 'FILE' : 'DEPLOYED',
        );
    }
}

export class CoreMockDetailsDto {
    private constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly method: string,
        public readonly path: string,
        public readonly isEnabled: boolean,
        public readonly source: CoreMockSource,
        public readonly response: {
            code: number,
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
            base.isEnabled,
            base.source,
            {
                code: mock.response.code,
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
