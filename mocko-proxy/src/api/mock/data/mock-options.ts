import mock = jest.mock;

export type MockResponse = {
    code: number | string,
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

const definitionFromConfig = ([req, res]: [string, any]): MockDefinition => {
    const [method, ...pathParts] = req.split(" ");
    const path = pathParts.join(" ");
    const headers = res[0].headers[0];

    return {
        method, path,
        response: {
            code: res[0].status,
            body: res[0].body,
            headers: headers,
        },
    };
};

export const optionsFromConfig = (config: any): MockOptions => {
    const mockEntries = config.mock
        .reduce((acc, v) => ({...acc, ...v}));
    const mocks = Object.entries(mockEntries)
        .map(definitionFromConfig);
    return { mocks };
};
