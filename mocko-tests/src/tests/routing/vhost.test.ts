import { createSubject, MockoInstance } from '../../harness';

describe('vhost', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
    await subject.createMock(`
      mock "GET /vhost" {
        body = "global"
      }
      mock "GET /vhost" {
        host = "mocko.dev"
        body = "vhost"
      }
      mock "GET /vhost-only" {
        host = "mocko.dev"
        body = "vhost"
      }
    `);
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('registering a route with vhost should not override the global one', async () => {
    const res = await subject.client.get('/vhost');
    expect(res.data).toBe('global');
  });

  it('request with vhost should have higher priority', async () => {
    const res = await subject.client.get('/vhost', {
      headers: { Host: 'mocko.dev' },
    });
    expect(res.data).toBe('vhost');
  });

  it('vhost route should not be accessible globally', async () => {
    const res = await subject.client.get('/vhost-only');
    expect(res.status).toBe(404);
  });

  it('request with vhost only must work with vhost', async () => {
    const res = await subject.client.get('/vhost-only', {
      headers: { Host: 'mocko.dev' },
    });
    expect(res.data).toBe('vhost');
  });
});
