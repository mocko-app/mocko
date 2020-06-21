export type MockResponse = {
    code: number,
    body: string,
    headers: Record<string, string>
};

export type MockDefinition = {
    method: string,
    path: string,
    response: MockResponse
};

export type MockOptions = {
    mocks: MockDefinition[]
};
