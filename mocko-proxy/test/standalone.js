process.env.MOCKS_FOLDER = './test/mocks';
process.env.SILENT = 'true';

const helpersSuite = require('./helpers');

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Hoek = require('@hapi/hoek');
const Mocko = require('../dist/main');
const Axios = require('axios');

const { expect } = Code;
const { after, before, describe, it } = exports.lab = Lab.script();

describe('standalone', () => {
    let server;
    let mocko = Axios.create({
        baseURL: 'http://localhost:8080'
    });

    before(async () => {
        server = await Mocko.server;
    });

    after(async () => {
        await server.stop(false);
    });

    describe('response status', () => {
        it('returns 204 on healthcheck', async () => {
            const { status } = await mocko.get('/health');
            expect(status).to.equal(204);
        });

        it('defaults the status to 200 for GET, PUT and DELETE mocks', async () => {
            const get = await mocko.get('/default-status');
            expect(get.status).to.equal(200);
            const put = await mocko.put('/default-status');
            expect(put.status).to.equal(200);
            const del = await mocko.delete('/default-status');
            expect(del.status).to.equal(200);
        });

        it('defaults the status to 201 for POST mocks', async () => {
            const { status } = await mocko.post('/default-status');
            expect(status).to.equal(201);
        });

        it('defaults the status to 200 for wildcard mocks', async () => {
            const post = await mocko.post('/wildcard-no-status');
            expect(post.status).to.equal(200);
            const get = await mocko.get('/wildcard-no-status');
            expect(get.status).to.equal(200);
        });

        it('sets the status with the status parameter', async () => {
            const { status } = await mocko.get('/other-status');
            expect(status).to.equal(204);
        });

        it('returns 404 on undefined routes', async () => {
            let code;

            await mocko.get('/undefined-route')
                .then(({ status }) => code = status)
                .catch(({ response }) => code = response.status);
            
            expect(code).to.equal(404);
        });
    });

    describe('mock definition', () => {
        it('should set headers with the headers param', async () => {
            const { headers } = await mocko.get('/headers');
            expect(headers).to.contain({ 'x-custom-header': 'foo' });
        });

        it('should set the body with the body param', async () => {
            const { data } = await mocko.get('/body');
            expect(data).to.equal('Hello from Mocko :)');
        });

        it('should delay with the delay param', async () => {
            const timer = new Hoek.Bench();
            await mocko.get('/delay');
            const error = Math.abs(timer.elapsed() - 200);

            expect(error).to.be.below(20);
        });
    });

    describe('vhost', () => {
        it('registering a route with vhost should not override the global one', async () => {
            const { data } = await mocko.get('/vhost');
            expect(data).to.equal('global');
        });
    
        it('request with vhost should have higher priority', async () => {
            const { data } = await mocko.get('/vhost', {
                headers: {
                    Host: 'mocko.dev'
                }
            });
            expect(data).to.equal('vhost');
        });
    
        it('vhost route should not be accessible globally', async () => {
            let code;

            await mocko.get('/vhost-only')
                .then(({ status }) => code = status)
                .catch(({ response }) => code = response.status);

            expect(code).to.equal(404);
        });
    
        it('request with vhost only must work with vhost', async () => {
            const { data } = await mocko.get('/vhost-only', {
                headers: {
                    Host: 'mocko.dev'
                }
            });
            expect(data).to.equal('vhost');
        });
    });

    describe('helpers', helpersSuite(mocko, describe, it));
});
