const { expect } = require('@hapi/code');

module.exports = (mocko, _describe, it) => () => {
    it('should proxy to {{proxy}} address', async () => {
        const { data } = await mocko.get('/hello');
        expect(data).to.equal('hello from mocko-content');
    });

    it('should pass body through', async () => {
        const { status } = await mocko.post('/validate/body', { foo: 'bar' });
        expect(status).to.equal(201);
    });

    it('should pass headers through', async () => {
        const { status } = await mocko.post('/validate/header', {}, {headers: { 'x-foo': 'bar' }});
        expect(status).to.equal(201);
    });

    it('should pass query params through', async () => {
        const { status } = await mocko.post('/validate/query?foo=bar');
        expect(status).to.equal(201);
    });
};
