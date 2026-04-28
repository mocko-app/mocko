import { createSubject, MockoInstance } from '../../harness';

describe('route priority', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
    await subject.createMock(`
      mock "GET /priority/exact" {
        body = "exact"
      }
      mock "GET /priority/{id}" {
        body = "param"
      }
      mock "GET /priority/{any*}" {
        body = "catchall"
      }
      mock "GET /method-priority" {
        body = "get"
      }
      mock "* /method-priority" {
        body = "wildcard"
      }
      mock "GET /combined/exact" {
        body = "get-exact"
      }
      mock "* /combined/{id}" {
        body = "wildcard-param"
      }
    `);
  });

  afterAll(() => subject.stop());

  it('exact path beats parameterized', async () => {
    const res = await subject.client.get('/priority/exact');
    expect(res.data).toBe('exact');
  });

  it('parameterized path matches when no exact route exists', async () => {
    const res = await subject.client.get('/priority/123');
    expect(res.data).toBe('param');
  });

  it('parameterized path beats catch-all', async () => {
    const res = await subject.client.get('/priority/123');
    expect(res.data).toBe('param');
  });

  it('catch-all matches deeply nested paths', async () => {
    const res = await subject.client.get('/priority/a/b/c');
    expect(res.data).toBe('catchall');
  });

  it('specific method beats wildcard method', async () => {
    const res = await subject.client.get('/method-priority');
    expect(res.data).toBe('get');
  });

  it('wildcard method matches other methods', async () => {
    const res = await subject.client.post('/method-priority');
    expect(res.data).toBe('wildcard');
  });

  it('specific method + exact path beats wildcard method + param path', async () => {
    const res = await subject.client.get('/combined/exact');
    expect(res.data).toBe('get-exact');
  });

  it('wildcard method + param path matches other method + exact path', async () => {
    const res = await subject.client.post('/combined/exact');
    expect(res.data).toBe('wildcard-param');
  });
});
