import { createSubject, MockoInstance } from '../../../harness';

describe('control flags crud', () => {
  let subject: MockoInstance;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('lists, creates, edits and deletes flags via control api', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const flagKey = 'users:integration-1:status';

    const initialList = await control.get('/api/flags');
    expect(initialList.status).toBe(200);
    expect(initialList.data.flagKeys).toBeTruthy();
    expect(typeof initialList.data.isTruncated).toBe('boolean');

    const createRes = await control.put(
      `/api/flags/${encodeURIComponent(flagKey)}`,
      {
        value: '"pending"',
      },
    );
    expect(createRes.status).toBe(200);
    expect(createRes.data.value).toBe('"pending"');

    const getRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(getRes.status).toBe(200);
    expect(getRes.data.value).toBe('"\\"pending\\""');

    const patchRes = await control.put(
      `/api/flags/${encodeURIComponent(flagKey)}`,
      {
        value: '"approved"',
      },
    );
    expect(patchRes.status).toBe(200);
    expect(patchRes.data.value).toBe('"approved"');

    const deleteRes = await control.delete(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(deleteRes.status).toBe(204);

    const idempotentDeleteRes = await control.delete(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(idempotentDeleteRes.status).toBe(204);

    const missingRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(missingRes.status).toBe(404);
    expect(missingRes.data.code).toBe('FLAG_NOT_FOUND');
  });

  it('lists nested prefixes and forwards truncation from proxy', async () => {
    subject = await createSubject(
      { '--ui': true },
      {
        'FLAGS_LIST-LIMIT': '1',
      },
    );
    const control = subject.ensureControl();

    await control.put('/api/flags/users%3Aabc%3Astatus', {
      value: '"active"',
    });
    await control.put('/api/flags/users%3Aabc%3Abalance', {
      value: '10',
    });
    await control.put('/api/flags/users%3Aabc%3Ameta%3Aplan', {
      value: '"gold"',
    });

    const prefixList = await control.get('/api/flags?prefix=users:abc:');
    expect(prefixList.status).toBe(200);
    expect(prefixList.data.isTruncated).toBe(true);
    expect(prefixList.data.flagKeys.length).toBe(1);
    expect(['PREFIX', 'FLAG']).toContain(prefixList.data.flagKeys[0].type);
  });

  it('builds prefix hierarchy from a nested key', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await control.put('/api/flags/foo%3Abar%3Abaz', {
      value: '"ok"',
    });

    const rootList = await control.get('/api/flags');
    expect(rootList.status).toBe(200);
    const hasFooPrefix = rootList.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'foo',
    );
    expect(hasFooPrefix).toBe(true);

    const fooList = await control.get('/api/flags?prefix=foo:');
    expect(fooList.status).toBe(200);
    const hasBarPrefix = fooList.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'bar',
    );
    expect(hasBarPrefix).toBe(true);

    const barList = await control.get('/api/flags?prefix=foo:bar:');
    expect(barList.status).toBe(200);
    const hasBazFlag = barList.data.flagKeys.some(
      (item: any) => item.type === 'FLAG' && item.name === 'baz',
    );
    expect(hasBazFlag).toBe(true);
  });
});
