import {
  createSubject,
  createContent,
  MockoInstance,
  CONTENT_PORT,
} from '../../harness';

describe('proxy', () => {
  let subject: MockoInstance;
  let content: MockoInstance;

  beforeEach(async () => {
    content = await createContent();
    subject = await createSubject();
  });

  afterEach(async () => {
    await subject.stop();
    await content.stop();
  });

  it('proxies to {{proxy}} address', async () => {
    await content.createMock(`
      mock "GET /hello" {
        body = "hello from mocko-content"
      }
    `);
    await subject.createMock(`
      mock "GET /hello" {
        body = "{{proxy 'http://localhost:${CONTENT_PORT}/'}}"
      }
    `);

    const res = await subject.client.get('/hello');
    expect(res.data).toBe('hello from mocko-content');
  });

  it('passes body through', async () => {
    await content.createMock(`
      mock "POST /validate/body" {
        body = "{{#is request.body.foo 'bar'}}{{else}}{{setStatus 400}}{{/is}}"
      }
    `);
    await subject.createMock(`
      mock "POST /validate/{any}" {
        body = "{{proxy 'http://localhost:${CONTENT_PORT}/'}}"
      }
    `);

    const res = await subject.client.post('/validate/body', { foo: 'bar' });
    expect(res.status).toBe(201);
  });

  it('passes headers through', async () => {
    await content.createMock(`
      mock "POST /validate/header" {
        body = "{{#is request.headers.x-foo 'bar'}}{{else}}{{setStatus 400}}{{/is}}"
      }
    `);
    await subject.createMock(`
      mock "POST /validate/{any}" {
        body = "{{proxy 'http://localhost:${CONTENT_PORT}/'}}"
      }
    `);

    const res = await subject.client.post(
      '/validate/header',
      {},
      { headers: { 'x-foo': 'bar' } },
    );
    expect(res.status).toBe(201);
  });

  it('passes query params through', async () => {
    await content.createMock(`
      mock "POST /validate/query" {
        body = "{{#is request.query.foo 'bar'}}{{else}}{{setStatus 400}}{{/is}}"
      }
    `);
    await subject.createMock(`
      mock "POST /validate/{any}" {
        body = "{{proxy 'http://localhost:${CONTENT_PORT}/'}}"
      }
    `);

    const res = await subject.client.post('/validate/query?foo=bar');
    expect(res.status).toBe(201);
  });

  it('proxies to a named host', async () => {
    await content.createMock(`
      mock "GET /v1/host-one" { }
      mock "GET /v2/host-two" { }
    `);
    await subject.createMock(`
      host "v1" {
        source      = "v1.local"
        destination = "http://localhost:${CONTENT_PORT}/v1"
      }
      host "v2" {
        source      = "v2.local"
        destination = "http://localhost:${CONTENT_PORT}/v2"
      }
      mock "GET /host-one" {
        body = "{{proxy 'v1'}}"
      }
      mock "GET /host-two" {
        body = "{{proxy 'v2'}}"
      }
    `);

    expect((await subject.client.get('/host-one')).status).toBe(200);
    expect((await subject.client.get('/host-two')).status).toBe(200);
  });

  it('proxies depending on request host when no mock is mapped', async () => {
    await content.createMock(`
      mock "GET /{version}/host-default" {
        body = "{{request.params.version}}"
      }
    `);
    await subject.createMock(`
      host "v1" {
        source      = "v1.local"
        destination = "http://localhost:${CONTENT_PORT}/v1"
      }
      host "v2" {
        source      = "v2.local"
        destination = "http://localhost:${CONTENT_PORT}/v2"
      }
    `);

    const v1 = await subject.client.get('/host-default', {
      headers: { Host: 'v1.local' },
    });
    expect(v1.data).toBe('v1');

    const v2 = await subject.client.get('/host-default', {
      headers: { Host: 'v2.local' },
    });
    expect(v2.data).toBe('v2');
  });

  it('proxies depending on request host when using generic proxy helper', async () => {
    await content.createMock(`
      mock "GET /{version}/host-generic" {
        body = "{{request.params.version}}"
      }
    `);
    await subject.createMock(`
      host "v1" {
        source      = "v1.local"
        destination = "http://localhost:${CONTENT_PORT}/v1"
      }
      host "v2" {
        source      = "v2.local"
        destination = "http://localhost:${CONTENT_PORT}/v2"
      }
      mock "GET /host-generic" {
        body = "{{proxy}}"
      }
    `);

    const v1 = await subject.client.get('/host-generic', {
      headers: { Host: 'v1.local' },
    });
    expect(v1.data).toBe('v1');

    const v2 = await subject.client.get('/host-generic', {
      headers: { Host: 'v2.local' },
    });
    expect(v2.data).toBe('v2');
  });
});
