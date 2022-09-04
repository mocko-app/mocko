import { api, proxy } from "../utils/axios";
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

    it('must 404 when fetching non existent mock', async () => {
        expect.assertions(1);

        try {
            await api.get('/mocks/foo');
        } catch(error) {
            expect(error.response.status).toBe(404);
        }
    });

    it('must fail to create mock when name is too big', async () => {
        expect.assertions(1);

        try {
            await createMock("Huuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuge name");
        } catch(error) {
            expect(error.response.status).toBe(400);
        }
    });

    it('must allow mocks to have an empty body', async () => {
        const createMockPromise = createMock("empty body", '');
        await expect(createMockPromise).resolves.toBeTruthy();
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

    it('must create mocks as enabled', async () => {
        const name = uuidv4().split('-')[0];
        const mock = await createMock(name);

        expect(mock.isEnabled).toBe(true);
    });

    it('must disable mocks on list', async () => {
        const name = uuidv4().split('-')[0];
        const mock = await createMock(name);
        await api.put(`/mocks/${mock.id}/disable`);

        const { data: mocks } = await api.get('/mocks');
        const updatedMock = mocks.find(m => m.id === mock.id);

        expect(updatedMock.isEnabled).toBe(false);
    });

    it('must disable mocks on getOne', async () => {
        const name = uuidv4().split('-')[0];
        const mock = await createMock(name);
        await api.put(`/mocks/${mock.id}/disable`);

        const { data: updatedMock } = await api.get(`/mocks/${mock.id}`);

        expect(updatedMock.isEnabled).toBe(false);
    });

    it('must not map disabled mocks', async () => {
        expect.assertions(1);

        const name = uuidv4().split('-')[0];
        const mock = await createMock(name);
        await api.put(`/mocks/${mock.id}/disable`);
        await sleep(DEPLOY_TIME);

        try {
            await proxy.get(`${mock.path}`);
        } catch(error) {
            expect(error.response.status).toBe(404);
        }
    });

    it('must map re-enabled mocks', async () => {
        const name = uuidv4().split('-')[0];
        const mock = await createMock(name);
        await api.put(`/mocks/${mock.id}/disable`);
        await sleep(DEPLOY_TIME);
        await api.put(`/mocks/${mock.id}/enable`);
        await sleep(DEPLOY_TIME);

        const { status } = await proxy.get(`${mock.path}`);

        expect(status).toBe(200);
    });

    it('must create mocks with paths missing initial slash', async () => {
        const name = uuidv4().split('-')[0];
        await createMock(name, 'body', 'path-no-slash');
        const { status } = await proxy.get(`/path-no-slash`);
        expect(status).toBe(200);
    });
});
