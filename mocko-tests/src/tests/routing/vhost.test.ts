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

describe('vhost case-insensitivity', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
    await subject.createMock(`
      host "bar" {
        source = "bar.local"
      }
      host "Baz" {
        source = "baz.local"
      }
      host "mixed" {
        source = "Mixed.Local"
      }
      mock "GET /case-slug" {
        host = "Bar"
        body = "bar"
      }
      mock "GET /case-slug-reverse" {
        host = "baz"
        body = "baz"
      }
      mock "GET /case-source" {
        host = "mixed"
        body = "mixed"
      }
      mock "GET /case-source-ref" {
        host = "MIXED.local"
        body = "mixed by source"
      }
      mock "GET /case-literal" {
        host = "Literal.Local"
        body = "literal"
      }
    `);
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('binds a mock to a host slug that differs only in case', async () => {
    const res = await subject.client.get('/case-slug', {
      headers: { Host: 'bar.local' },
    });
    expect(res.data).toBe('bar');

    const other = await subject.client.get('/case-slug', {
      headers: { Host: 'Bar' },
    });
    expect(other.status).toBe(404);
  });

  it('binds a lowercase mock host to a mixed-case host slug', async () => {
    const res = await subject.client.get('/case-slug-reverse', {
      headers: { Host: 'baz.local' },
    });
    expect(res.data).toBe('baz');
  });

  it('matches a mixed-case host source regardless of the request host case', async () => {
    for (const host of ['mixed.local', 'Mixed.Local', 'MIXED.LOCAL']) {
      const res = await subject.client.get('/case-source', {
        headers: { Host: host },
      });
      expect(res.data).toBe('mixed');
    }
  });

  it('matches a lowercase host source against an uppercase request host', async () => {
    const res = await subject.client.get('/case-slug', {
      headers: { Host: 'BAR.LOCAL' },
    });
    expect(res.data).toBe('bar');
  });

  it('binds a mock to a host source that differs only in case', async () => {
    const res = await subject.client.get('/case-source-ref', {
      headers: { Host: 'mixed.local' },
    });
    expect(res.data).toBe('mixed by source');
  });

  it('matches a literal vhost regardless of case', async () => {
    const lower = await subject.client.get('/case-literal', {
      headers: { Host: 'literal.local' },
    });
    expect(lower.data).toBe('literal');

    const upper = await subject.client.get('/case-literal', {
      headers: { Host: 'LITERAL.LOCAL' },
    });
    expect(upper.data).toBe('literal');
  });
});
