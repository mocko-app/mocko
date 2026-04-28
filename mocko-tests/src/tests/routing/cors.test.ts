import { createSubject, MockoInstance, randomPath } from '../../harness';

describe('cors', () => {
  let subject: MockoInstance;
  const origin = 'https://example.com';

  async function preflight(path: string, method: 'GET' | 'POST') {
    return subject.client.options(path, {
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': method,
      },
    });
  }

  beforeAll(async () => {
    subject = await createSubject();
    await subject.createMock(`
      mock "GET /cors-resource" {
        body = "hello"
      }
    `);
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('responds to a GET preflight on a defined route', async () => {
    const res = await preflight('/cors-resource', 'GET');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
    expect(res.headers['access-control-allow-methods']).toBe('GET');
  });

  it('responds to a GET preflight on a GET-only mock route', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "get only"
      }
    `);
    const res = await preflight(path, 'GET');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
    expect(res.headers['access-control-allow-methods']).toBe('GET');
  });

  it('responds to a POST preflight on a POST-only mock route', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "POST ${path}" {
        body = "post only"
      }
    `);
    const res = await preflight(path, 'POST');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
    expect(res.headers['access-control-allow-methods']).toBe('POST');
  });
});
