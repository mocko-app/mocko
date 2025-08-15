const { expect } = require('@hapi/code');

module.exports = (mocko, describe, it) => () => {
    describe('context', () => {
        it('should fill the request.params context', async () => {
            const { data } = await mocko.get('/ctx/param/myparam');
            expect(data).to.equal('myparam');
        });

        it('should fill the request.headers context', async () => {
            const { data } = await mocko.get('/ctx/header', {
                headers: {
                    'X-Header': 'myheader'
                }
            });
            expect(data).to.equal('myheader');
        });

        it('should fill the request.body context', async () => {
            const { data } = await mocko.post('/ctx/body', {
                foo: 'myfield'
            });
            expect(data).to.equal('myfield');
        });

        it('should fill the request.query context', async () => {
            const { data } = await mocko.get('/ctx/query?foo=myquery');
            expect(data).to.equal('myquery');
        });
    });

    describe('helpers', () => {
        it('allows the usage of handlebars-helpers', async () => {
            const { data } = await mocko.get('/hbs-helpers');
            expect(data).to.include('Foo');
        });

        it('setStatus should override the status', async () => {
            const { status } = await mocko.get('/set-status');
            expect(status).to.equal(202);
        });

        it('setStatus should override the status from a different context', async () => {
            const { status } = await mocko.get('/set-status-ooc');
            expect(status).to.equal(202);
        });

        it('setStatus should accept strings', async () => {
            const { status } = await mocko.get('/set-status/202');
            expect(status).to.equal(202);
        });

        it('setHeader should set headers', async () => {
            const { headers } = await mocko.get('/set-header');
            expect(headers).to.include({ 'x-foo': 'bar' });
        });

        it('setHeader should merge with mocked headers', async () => {
            const { headers } = await mocko.get('/set-both-headers');
            expect(headers).to.include({ 'x-mocked': 'foo' });
        });

        it('setHeader should override headers', async () => {
            const { headers } = await mocko.get('/override-header');
            expect(headers).to.include({ 'x-foo': 'bar' });
        });

        it('setHeader should override headers with lower casing', async () => {
            const { headers } = await mocko.get('/override-header-lower');
            expect(headers).to.include({ 'x-foo': 'bar' });
        });

        it('setHeader should override headers with upper casing', async () => {
            const { headers } = await mocko.get('/override-header-upper');
            expect(headers).to.include({ 'x-foo': 'bar' });
        });

        it('setHeader should not persist between requests', async () => {
            const { headers } = await mocko.get('/dynamic-header/true');
            expect(headers).to.include({ 'x-foo': 'bar' });

            const { headers: headers2 } = await mocko.get('/dynamic-header/false');
            expect(headers2).to.not.include({ 'x-foo': 'bar' });
        });

        it('uuid should return valid UUID', async () => {
            const { data } = await mocko.get('/helpers/uuid');
            expect(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(data)).to.be.true();
        });

        it('substring should work with 2 params', async () => {
            const { data } = await mocko.get('/helpers/substring/1');
            expect(data).to.equal('Lore');
        });

        it('substring should work with 1 param', async () => {
            const { data } = await mocko.get('/helpers/substring/2');
            expect(data).to.equal('sum');
        });
    });

    describe('flags', () => {
        it('should set and get flags correctly', async () => {
            await mocko.put('/flag/ablueblue');
            const { data } = await mocko.get('/flag');
            expect(data).to.equal('ablueblue');
        });

        it('should not accept flags with empty sections in the middle', async () => {
            let code;

            await mocko.get('/flag/foo::bar')
                .then(({ status }) => code = status)
                .catch(({ response }) => code = response.status);

            expect(code).to.equal(500);
        });

        it('should not accept flags with empty sections in the end', async () => {
            let code;

            await mocko.get('/flag/foo:')
                .then(({ status }) => code = status)
                .catch(({ response }) => code = response.status);

            expect(code).to.equal(500);
        });

        it('should set, delete and \'has\' flags correctly', async () => {
            await mocko.put('/flag/foo');
            const first = await mocko.get('/has-flag');
            expect(first.data).to.include('yes');

            await mocko.delete('/flag');
            const second = await mocko.get('/has-flag');
            expect(second.data).to.include('no');
        });

        it('hasFlag must work without an else block', async () => {
            await mocko.put('/flag/foo');
            const first = await mocko.get('/has-flag-noelse');
            expect(first.data).to.include('yes');

            await mocko.delete('/flag');
            const second = await mocko.get('/has-flag-noelse');
            expect(second.data).not.to.include('yes');
        });
    });

    describe('vars', () => {
        it('should set and get vars correctly', async () => {
            const { data } = await mocko.get('/vars/1');
            expect(data.trim()).to.equal('bar');
        });

        it('set should not break on resyncs', async () => {
            const { data } = await mocko.get('/vars/2');
            expect(data.trim()).to.equal('bar');
        });

        it('get should not break on resyncs', async () => {
            const { data } = await mocko.get('/vars/3');
            expect(data.trim()).to.equal('bar');
        });

        it('should set from a different context', async () => {
            const { data } = await mocko.get('/vars/4');
            expect(data.trim()).to.equal('bar');
        });
    });
};
