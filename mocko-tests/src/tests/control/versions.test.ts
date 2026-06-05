import { createSubject, MockoInstance } from '../../harness';

describe('GET /api/versions', () => {
  let subject: MockoInstance;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('returns non-empty version strings for both control and core', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const res = await control.get('/api/versions');

    expect(res.status).toBe(200);
    expect(typeof res.data.control).toBe('string');
    expect(res.data.control.length).toBeGreaterThan(0);
    expect(typeof res.data.core).toBe('string');
    expect(res.data.core.length).toBeGreaterThan(0);
  });
});
