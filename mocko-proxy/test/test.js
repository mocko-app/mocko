const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Mocko = require('../dist/main');

const { expect } = Code;
const { after, before, describe, it } = exports.lab = Lab.script();

describe('integrated', () => {
    let server;

    before(async () => {
        server = await Mocko.server;
    });

    after(async () => {
        await server.stop(false);
    });

    it('returns true when 1 + 1 equals 2', () => {
        expect(1 + 1).to.equal(2);
    });
});
