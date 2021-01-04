import { content } from '../utils/axios';

describe('Mocko proxy from config, proxy off', () => {
    it('must return 404 for undefined routes', async () => {
        expect.assertions(1);

        try {
            await content.get('/undefined-route');
        } catch(error) {
            expect(error.response.status).toBe(404);
        }
    });

    it('must return default 200 for GET, PUT and DELETE', async () => {
        const get = await content.get('/no-status');
        expect(get.status).toBe(200);

        const put = await content.put('/no-status');
        expect(put.status).toBe(200);

        const del = await content.delete('/no-status');
        expect(del.status).toBe(200);
    });

    it('must return default 201 for POST', async () => {
        const post = await content.post('/no-status');
        expect(post.status).toBe(201);
    });

    it('must return default 200 for *', async () => {
        const get = await content.get('/wildcard-no-status');
        expect(get.status).toBe(200);

        const post = await content.post('/wildcard-no-status');
        expect(post.status).toBe(200);
    });

    it('must set headers using config', async () => {
        const { headers } = await content.get('/header');
        expect(headers.foo).toBe('bar');
    });

    it('must delay when configured', async () => {
        const start = Date.now();
        await content.get('/delay');
        const deltaT = Date.now() - start;
        const error = deltaT - 500;

        expect(error).toBeLessThan(50);
    });

    it('registering a route with vhost should not override the global one', async () => {
        const { data } = await content.get('/vhost');
        expect(data).toBe('global');
    });

    it('request with vhost should have higher priority', async () => {
        const { data } = await content.get('/vhost', {
            headers: {
                Host: 'mocko.dev'
            }
        });
        expect(data).toBe('vhost');
    });

    it('vhost route should not be accessible globally', async () => {
        expect.assertions(1);

        try {
            await content.get('/vhost-only');
        } catch(error) {
            expect(error.response.status).toBe(404);
        }
    });

    it('request with vhost should have higher priority', async () => {
        const { data } = await content.get('/vhost-only', {
            headers: {
                Host: 'mocko.dev'
            }
        });
        expect(data).toBe('vhost');
    });
});
