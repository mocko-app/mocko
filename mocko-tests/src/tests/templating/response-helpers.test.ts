import { createSubject, MockoInstance, randomPath } from '../../harness';

describe('templating response helpers', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('setStatus overrides the status', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        status = 404
        body = "{{setStatus 202}}"
      }
    `);

    expect((await subject.client.get(path)).status).toBe(202);
  });

  it('setStatus overrides the status from a different context', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        status = 404
        body = "{{#each 'foo'}}{{setStatus 202}}{{/each}}"
      }
    `);

    expect((await subject.client.get(path)).status).toBe(202);
  });

  it('setStatus accepts strings', async () => {
    const basePath = randomPath();
    await subject.createMock(`
      mock "GET ${basePath}/{status}" {
        status = 404
        body = "{{setStatus request.params.status}}"
      }
    `);

    expect((await subject.client.get(`${basePath}/202`)).status).toBe(202);
  });

  it('setHeader sets headers', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{setHeader 'x-foo' 'bar'}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.headers['x-foo']).toBe('bar');
  });

  it('setHeader merges with mocked headers', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        headers {
          x-mocked = "foo"
        }
        body = "{{setHeader 'x-dynamic' 'bar'}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.headers['x-mocked']).toBe('foo');
    expect(res.headers['x-dynamic']).toBe('bar');
  });

  it('setHeader overrides headers', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        headers {
          x-foo = "wrong"
        }
        body = "{{setHeader 'x-foo' 'bar'}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.headers['x-foo']).toBe('bar');
  });

  it('setHeader overrides headers with lower casing', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        headers {
          X-Foo = "wrong"
        }
        body = "{{setHeader 'x-foo' 'bar'}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.headers['x-foo']).toBe('bar');
  });

  it('setHeader overrides headers with upper casing', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        headers {
          x-foo = "wrong"
        }
        body = "{{setHeader 'X-Foo' 'bar'}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.headers['x-foo']).toBe('bar');
  });

  it('setHeader does not persist between requests', async () => {
    const basePath = randomPath();
    await subject.createMock(`
      mock "GET ${basePath}/{shouldSet}" {
        body = "{{#is request.params.shouldSet 'true'}}{{setHeader 'X-Foo' 'bar'}}{{/is}}"
      }
    `);

    const res1 = await subject.client.get(`${basePath}/true`);
    expect(res1.headers['x-foo']).toBe('bar');

    const res2 = await subject.client.get(`${basePath}/false`);
    expect(res2.headers['x-foo']).toBeUndefined();
  });
});
