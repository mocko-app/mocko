process.env.MOCKS_FOLDER = './test/mocks';
process.env.SILENT = 'true';

const helpersSuite = require('./helpers');

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
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

        it('defaults the status to 200 for GET mocks', async () => {
            const { status } = await mocko.get('/default-status');
            expect(status).to.equal(200);
        });

        it('defaults the status to 201 for POST mocks', async () => {
            const { status } = await mocko.post('/default-status');
            expect(status).to.equal(201);
        });

        it('sets the status with the status parameter', async () => {
            const { status } = await mocko.get('/other-status');
            expect(status).to.equal(204);
        });
    });

    describe('headers', () => {
        it('should set headers with the headers param', async () => {
            const { headers } = await mocko.get('/headers');
            expect(headers).to.contain({ 'x-custom-header': 'foo' });
        });
    });

    describe('body', () => {
        it('should set the body with the body param', async () => {
            const { data } = await mocko.get('/body');
            expect(data).to.equal('Hello from Mocko :)');
        });
    });

    describe('helpers', helpersSuite(mocko, describe, it));
});
