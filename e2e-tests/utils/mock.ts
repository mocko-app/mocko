import { AxiosResponse } from "axios";
import { api, proxy } from "./axios";
import { v4 as uuidv4 } from "uuid";
import { promisify } from "util";

const sleep = promisify(setTimeout);
const DEPLOY_TIME = 100;

export async function mockAndGet<T>(body: string): Promise<AxiosResponse<T>> {
    const path = `/${uuidv4()}`;
    await api.post('/mocks', {
        name: 'Unnamed',
        method: 'GET',
        path,
        response: {
            code: 200,
            headers: {},
            body
        }
    });
    await sleep(DEPLOY_TIME);

    return await proxy.get(path);
}
