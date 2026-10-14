import { createSubject, MockoInstance } from '../../harness';

describe('control pages', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject({ '--ui': true });
  });

  afterAll(async () => {
    await subject.stop();
  });

  // A statically prerendered page seeds the client router with the hard-load
  // query, and returning to the page later restores that stale query.
  it.each(['/mocks?q=stale', '/callbacks?q=stale', '/mocks/new?from=stale'])(
    'renders %s per request instead of serving a prerender',
    async (url) => {
      const res = await subject.ensureControl().get(url);

      expect(res.status).toBe(200);
      expect(res.headers['x-nextjs-prerender']).toBeUndefined();
      expect(res.headers['cache-control']).toContain('no-store');
    },
  );
});
