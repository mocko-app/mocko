import { createSubject, MockoInstance } from '../../harness';

describe('control management operations', () => {
  let subject: MockoInstance | null = null;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
      subject = null;
    }
  });

  it('reports unsupported management in storeless mode', async () => {
    subject = await createSubject({ '--ui': true, '--watch': false });

    const getRes = await subject.ensureControl().get('/api/operations');
    expect(getRes.status).toBe(200);
    expect(getRes.data).toEqual({
      operations: [],
      sentinelAgeSeconds: null,
      managementSupported: false,
    });

    const postRes = await subject.ensureControl().post('/api/operations', {
      type: 'STALE_FLAGS',
      staleFlagsData: { thresholdSeconds: 2 },
    });
    expect(postRes.status).toBe(422);
  });
});
