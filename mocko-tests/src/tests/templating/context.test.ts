import { createSubject, MockoInstance, randomPath } from '../../harness';

describe('templating context', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('fills the request.params context', async () => {
    const basePath = randomPath();
    await subject.createMock(`
      mock "GET ${basePath}/{param}" {
        body = "{{request.params.param}}"
      }
    `);

    const res = await subject.client.get(`${basePath}/myparam`);
    expect(res.data).toBe('myparam');
  });

  it('fills the request.headers context', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{request.headers.x-header}}"
      }
    `);

    const res = await subject.client.get(path, {
      headers: { 'X-Header': 'myheader' },
    });
    expect(res.data).toBe('myheader');
  });

  it('fills the request.body context', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "POST ${path}" {
        body = "{{request.body.foo}}"
      }
    `);

    const res = await subject.client.post(path, { foo: 'myfield' });
    expect(res.data).toBe('myfield');
  });

  it('fills the request.query context', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{request.query.foo}}"
      }
    `);

    const res = await subject.client.get(`${path}?foo=myquery`);
    expect(res.data).toBe('myquery');
  });
});
