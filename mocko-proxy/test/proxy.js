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

    it('should ignore files and directories starting with dot(.)', async () => {
        let code;

        await mocko.get('/dot-route')
            .then(({ status }) => code = status)
            .catch(({ response }) => code = response.status);

        expect(code).to.equal(404);
    });

    it('should proxy to host name', async () => {
        const { status: s1 } = await mocko.get('/host-one');
        expect(s1).to.equal(200);
        const { status: s2 } = await mocko.get('/host-two');
        expect(s2).to.equal(200);
    });

    it('should proxy to host deppending on request host when no mock is mapped', async () => {
        const { data: d1 } = await mocko.get('/host-default', {
            headers: {
                Host: 'v1.local',
            },
        });
        expect(d1).to.equal('v1');

        const { data: d2 } = await mocko.get('/host-default', {
            headers: {
                Host: 'v2.local',
            },
        });
        expect(d2).to.equal('v2');
    });

    it('should proxy to host deppending on request host when using generic proxy helper', async () => {
        const { data: d1 } = await mocko.get('/host-generic', {
            headers: {
                Host: 'v1.local',
            },
        });
        expect(d1).to.equal('v1');

        const { data: d2 } = await mocko.get('/host-generic', {
            headers: {
                Host: 'v2.local',
            },
        });
        expect(d2).to.equal('v2');
    });
};
