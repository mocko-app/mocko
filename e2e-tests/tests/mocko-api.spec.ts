import { api } from "../utils/axios";
import { createMock, mockAndGet, sleep, DEPLOY_TIME } from "../utils/mock";
import { v4 as uuidv4 } from "uuid";

describe('Mocko API', () => {
    it('must return created mocks', async () => {
        const name = uuidv4().split('-')[0];

        await createMock(name);
        const { data } = await api.get('/mocks');
        const mocks = data.filter(m => m.name === name);

        expect(mocks.length).toBe(1);
    });

    it('must fail to create mock when name is too big', async () => {
        expect.assertions(1);

        try {
            await createMock("Huuuuuuuuuuuuuuuuuuuuuuuge name");
        } catch(error) {
            expect(error.response.status).toBe(400);
        }
    });

    it('must delete mocks', async () => {
        const name = uuidv4().split('-')[0];

        const mock = await createMock(name);
        await api.delete(`/mocks/${mock.id}`);
        await sleep(DEPLOY_TIME);
        const { data } = await api.get('/mocks');
        const mocks = data.filter(m => m.name === name);

        expect(mocks.length).toBe(0);
    });

    it('must pass correct information to proxy', async () => {
        const response = await mockAndGet('foo', {
            foo: 'bar'
        }, 202);

        expect(response.headers.foo).toBe('bar');
        expect(response.data).toBe('foo');
        expect(response.status).toBe(202);
    });

    it('the proxy helper must... proxy', async () => {
        const response = await mockAndGet("fsodinsdfoni{{proxy}}", {}, 200, '/hello');
        expect(response.data).toBe('hello from mocko-content');
    });

    it('must overide proxy URI with the one passed to the proxy helper', async () => {
        const response = await mockAndGet<any>("{{proxy 'https://jsonplaceholder.typicode.com/'}}",
                {}, 200, '/users/1');
        
        expect(response.data.id).toBe(1);
    });
});
