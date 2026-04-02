import { createSubject, MockoInstance, randomPath } from '../../harness';

describe('vars', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('sets and gets vars correctly', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{= $foo 'bar'}}{{ $foo }}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.data.trim()).toBe('bar');
  });

  it('set does not break on resyncs', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{= $foo 'WRONG'}}{{#eq true true}}{{= $foo 'bar'}}{{/eq}}{{#hasFlag 'anything'}}{{/hasFlag}}{{ $foo }}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.data.trim()).toBe('bar');
  });

  it('get does not break on resyncs', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{= $foo 'bar'}}{{ $foo }}{{= $foo 'WRONG'}}{{#hasFlag 'anything'}}{{/hasFlag}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.data.trim()).toBe('bar');
  });

  it('sets from a different context', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{#each 'foo'}}{{= $foo 'bar'}}{{/each}}{{ $foo }}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.data.trim()).toBe('bar');
  });
});
