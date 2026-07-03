import { createSubject, MockoInstance, setControlFlag } from '../../../harness';

jest.setTimeout(30000);

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
    expect(typeof initialList.data.count).toBe('number');
    expect(typeof initialList.data.matchCount).toBe('number');

    const createRes = await setControlFlag(control, flagKey, 'pending');
    expect(createRes.status).toBe(200);
    expect(createRes.data.value).toBe('"pending"');

    const getRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(getRes.status).toBe(200);
    expect(getRes.data.value).toBe('"pending"');

    const patchRes = await setControlFlag(control, flagKey, 'approved');
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

  it('requires a valid source when setting flags via control api', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    const missingSourceRes = await control.put('/api/flags/source%3Amissing', {
      value: '"one"',
    });
    expect(missingSourceRes.status).toBe(400);

    const invalidSourceRes = await control.put('/api/flags/source%3Ainvalid', {
      value: '"one"',
      source: 'UNKNOWN',
    });
    expect(invalidSourceRes.status).toBe(400);
  });

  it('lists nested prefixes and forwards truncation from proxy', async () => {
    subject = await createSubject(
      { '--ui': true },
      {
        'FLAGS_LIST-LIMIT': '1',
      },
    );
    const control = subject.ensureControl();

    await setControlFlag(control, 'users:abc:status', 'active');
    await setControlFlag(control, 'users:abc:balance', 10);
    await setControlFlag(control, 'users:abc:meta:plan', 'gold');

    const prefixList = await control.get('/api/flags?prefix=users:abc:');
    expect(prefixList.status).toBe(200);
    expect(prefixList.data.isTruncated).toBe(true);
    expect(prefixList.data.flagKeys.length).toBe(1);
    expect(['PREFIX', 'FLAG']).toContain(prefixList.data.flagKeys[0].type);
  });

  it('builds prefix hierarchy from a nested key', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await setControlFlag(control, 'foo:bar:baz', 'ok');

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

  it('filters deeply within the current prefix and returns folder counts', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await setControlFlag(control, 'users:1234:status', 'active');
    await setControlFlag(control, 'users:1234:meta:plan', 'gold');
    await setControlFlag(control, 'users:9999:status', 'inactive');

    const rootSearch = await control.get('/api/flags?q=1234');
    expect(rootSearch.status).toBe(200);
    expect(rootSearch.data.count).toBe(3);
    expect(rootSearch.data.matchCount).toBe(2);
    expect(rootSearch.data.flagKeys).toEqual([
      expect.objectContaining({
        type: 'PREFIX',
        name: 'users',
        count: 3,
        matchCount: 2,
      }),
    ]);

    const scopedSearch = await control.get('/api/flags?prefix=users:&q=1234');
    expect(scopedSearch.status).toBe(200);
    expect(scopedSearch.data.count).toBe(3);
    expect(scopedSearch.data.matchCount).toBe(2);
    expect(scopedSearch.data.flagKeys).toEqual([
      expect.objectContaining({
        type: 'PREFIX',
        name: '1234',
        count: 2,
        matchCount: 2,
      }),
    ]);

    const nestedList = await control.get('/api/flags?prefix=users:1234:');
    expect(nestedList.status).toBe(200);
    expect(nestedList.data.count).toBe(2);
    expect(nestedList.data.matchCount).toBe(2);
    expect(nestedList.data.flagKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'PREFIX',
          name: 'meta',
          count: 1,
          matchCount: 1,
        }),
        expect.objectContaining({ type: 'FLAG', name: 'status' }),
      ]),
    );
  });

  it('counts root flags alongside prefixes when filtering', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await setControlFlag(control, 'root-flag', 'on');
    await setControlFlag(control, 'prefix:deep-flag', 'on');
    await setControlFlag(control, 'prefix:ignored', 'off');

    const search = await control.get('/api/flags?q=flag');
    expect(search.status).toBe(200);
    expect(search.data.count).toBe(3);
    expect(search.data.matchCount).toBe(2);
    expect(search.data.flagKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'FLAG', name: 'root-flag' }),
        expect.objectContaining({
          type: 'PREFIX',
          name: 'prefix',
          count: 2,
          matchCount: 1,
        }),
      ]),
    );
  });

  it('filters flags case-insensitively', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await setControlFlag(control, 'users:AbC:status', 'active');
    await setControlFlag(control, 'users:xyz:status', 'inactive');

    const scopedSearch = await control.get('/api/flags?prefix=users:&q=ABC');
    expect(scopedSearch.status).toBe(200);
    expect(scopedSearch.data.flagKeys).toEqual([
      expect.objectContaining({
        type: 'PREFIX',
        name: 'AbC',
        count: 1,
        matchCount: 1,
      }),
    ]);
  });

  it('keeps matching descendants when the current prefix matches the query', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();

    await setControlFlag(control, 'users:1214:device', 'ios');
    await setControlFlag(control, 'users:1214:profile:phone', '555-1214');

    const res = await control.get('/api/flags?prefix=users:1214:&q=1214');
    expect(res.status).toBe(200);
    expect(res.data.flagKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'FLAG', name: 'device' }),
        expect.objectContaining({
          type: 'PREFIX',
          name: 'profile',
          count: 1,
          matchCount: 1,
        }),
      ]),
    );
  });
});
