import { createSubject, MockoInstance } from '../../harness';
import { nextPort } from '../../harness/port';

describe('proxy response passthrough', () => {
  let subject: MockoInstance;
  let content: MockoInstance;
  let contentPort: number;

  beforeAll(async () => {
    contentPort = nextPort();
    content = new MockoInstance({ '--watch': true, '--port': contentPort });
    await content.init();
    subject = await createSubject();
  });

  afterAll(async () => {
    await subject.stop();
    await content.stop();
  });

  it('passes upstream status code through', async () => {
    await content.createMock(`
      mock "GET /status-404" {
        status = 404
        body = "not found upstream"
      }
    `);
    await subject.createMock(`
      mock "GET /status-404" {
        body = "{{proxy 'http://localhost:${contentPort}/'}}"
      }
    `);
    const res = await subject.client.get('/status-404');
    expect(res.status).toBe(404);
  });

  it('passes upstream response headers through', async () => {
    await content.createMock(`
      mock "GET /with-headers" {
        body = "ok"
        headers {
          x-upstream-header = "upstream-value"
        }
      }
    `);
    await subject.createMock(`
      mock "GET /with-headers" {
        body = "{{proxy 'http://localhost:${contentPort}/'}}"
      }
    `);
    const res = await subject.client.get('/with-headers');
    expect(res.headers['x-upstream-header']).toBe('upstream-value');
  });

  it('passes upstream body through', async () => {
    await content.createMock(`
      mock "GET /body-passthrough" {
        body = "upstream body"
      }
    `);
    await subject.createMock(`
      mock "GET /body-passthrough" {
        body = "{{proxy 'http://localhost:${contentPort}/'}}"
      }
    `);
    const res = await subject.client.get('/body-passthrough');
    expect(res.data).toBe('upstream body');
  });
});
