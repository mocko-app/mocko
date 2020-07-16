import mock = jest.mock;

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
    mocks: MockDefinition[],
    data?: Record<string, any>,
};

const merge = (array: Record<string, any>[]): Record<string, any> =>
    array.reduce((acc, v) => ({ ...acc, ...v }));

const definitionFromConfig = ([req, res]: [string, any]): MockDefinition => {
    const [method, ...pathParts] = req.split(" ");
    const path = pathParts.join(" ");
    const headers = res?.[0]?.headers?.[0] || {};
    const code = res?.[0]?.status || (method === 'POST' ? 201 : 200);

    return {
        method, path,
        response: {
            code,
            body: res?.[0]?.body,
            headers: headers,
        },
    };
};

export const optionsFromConfig = (config: any): MockOptions => {
    const mocks = Object.entries(merge(config.mock))
        .map(definitionFromConfig);

    const data = config.data && Object.entries(merge(config.data))
        .map(([key, values]) => ({key, value: merge(values)}))
        .reduce((acc, {key, value}) => ({ ...acc, [key]: value}), {});

    return { mocks, data };
};
