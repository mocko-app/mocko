const { expect } = require('@hapi/code');

module.exports = (mocko, _describe, it) => () => {
    it('should proxy to {{proxy}} address', async () => {
        const { data } = await mocko.get('/hello');
        expect(data).to.equal('hello from mocko-content');
    });
};
