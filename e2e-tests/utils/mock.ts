import { AxiosResponse } from "axios";
import { api, proxy } from "./axios";
import { v4 as uuidv4 } from "uuid";
import { promisify } from "util";

export const sleep = promisify(setTimeout);
export const DEPLOY_TIME = 200;

export async function createMock(name: string, body = 'body'): Promise<any> {
    const path = `/${uuidv4()}`;
    const { data } = await api.post('/mocks', {
        name,
        method: 'GET',
        path,
        response: {
            code: 200,
            headers: {},
            body
        }
    });
    await sleep(DEPLOY_TIME);
    return data;
}

export async function mockAndGet<T>(body: string,
                                    headers: Record<string, string> = {},
                                    status = 200,
                                    mockPath?: string): Promise<AxiosResponse<T>> {
    const path = mockPath || `/${uuidv4()}`;
    await api.post('/mocks', {
        name: 'Unnamed',
        method: 'GET',
        path,
        response: {
            code: status,
            headers,
            body
        }
    });
    await sleep(DEPLOY_TIME);

    return await proxy.get(path);
}
