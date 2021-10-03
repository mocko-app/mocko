const { expect } = require('@hapi/code');

module.exports = (mocko, _describe, it) => () => {
    it('should proxy to {{proxy}} address', async () => {
        const { data } = await mocko.get('/hello');
        expect(data).to.equal('hello from mocko-content');
    });

    it('should proxy to host name', async () => {
        const { status } = await mocko.get('/proxy-to-host');
        expect(status).to.equal(200);
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

    it('should ignore files and directories starting with dot(.)', async () => {
        const { status } = await mocko.post('/dot-route');
        expect(status).to.equal(404);
    });
};
