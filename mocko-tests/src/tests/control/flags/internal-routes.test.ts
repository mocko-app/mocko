import { createSubject, MockoInstance, setCoreFlag } from '../../../harness';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('proxy __mocko__ flags routes', () => {
  let subject: MockoInstance;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('allows flag routes without authorization by default', async () => {
    subject = await createSubject({ '--ui': true });

    const listRes = await subject.client.get('/__mocko__/flags');
    expect(listRes.status).toBe(200);

    const getRes = await subject.client.get('/__mocko__/flags/test');
    expect(getRes.status).toBe(404);
  });

  it('requires authorization when management auth mode is all', async () => {
    subject = await createSubject(
      {},
      {
        MANAGEMENT_AUTH_MODE: 'all',
        DEPLOY_SECRET: 'secret',
      },
    );

    const listRes = await subject.client.get('/__mocko__/flags');
    expect(listRes.status).toBe(401);

    const getRes = await subject.client.get('/__mocko__/flags/test');
    expect(getRes.status).toBe(401);
  });

  it('supports full lifecycle in default deploy auth mode', async () => {
    subject = await createSubject();

    const createRes = await setCoreFlag(
      subject.client,
      'internal:test:flag',
      'one',
    );
    expect(createRes.status).toBe(200);

    const listRes = await subject.client.get(
      '/__mocko__/flags?prefix=internal:test:',
    );
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.data.flagKeys)).toBe(true);

    const getRes = await subject.client.get(
      '/__mocko__/flags/internal%3Atest%3Aflag',
    );
    expect(getRes.status).toBe(200);
    expect(getRes.data.value).toBe('"one"');

    const patchRes = await setCoreFlag(
      subject.client,
      'internal:test:flag',
      'two',
    );
    expect(patchRes.status).toBe(200);
    expect(patchRes.data.value).toBe('"two"');

    const deleteRes = await subject.client.delete(
      '/__mocko__/flags/internal%3Atest%3Aflag',
    );
    expect(deleteRes.status).toBe(204);
    const idempotentDeleteRes = await subject.client.delete(
      '/__mocko__/flags/internal%3Atest%3Aflag',
    );
    expect(idempotentDeleteRes.status).toBe(204);
  });

  it('expires flags set with a ttl and drops them from listings', async () => {
    subject = await createSubject();

    const createRes = await setCoreFlag(
      subject.client,
      'internal:ttl:flag',
      'temporary',
      'CONTROL',
      1,
    );
    expect(createRes.status).toBe(200);

    const getRes = await subject.client.get(
      '/__mocko__/flags/internal%3Attl%3Aflag',
    );
    expect(getRes.status).toBe(200);
    expect(getRes.data.value).toBe('"temporary"');

    const listRes = await subject.client.get(
      '/__mocko__/flags?prefix=internal:ttl:',
    );
    expect(listRes.status).toBe(200);
    expect(listRes.data.flagKeys).toEqual([
      expect.objectContaining({ type: 'FLAG', name: 'flag' }),
    ]);

    await sleep(1500);

    const expiredGetRes = await subject.client.get(
      '/__mocko__/flags/internal%3Attl%3Aflag',
    );
    expect(expiredGetRes.status).toBe(404);

    const expiredListRes = await subject.client.get(
      '/__mocko__/flags?prefix=internal:ttl:',
    );
    expect(expiredListRes.status).toBe(200);
    expect(expiredListRes.data.flagKeys).toEqual([]);
  });

  it('requires a valid source when setting flags on __mocko__ routes', async () => {
    subject = await createSubject();

    const missingSourceRes = await subject.client.put(
      '/__mocko__/flags/source%3Amissing',
      {
        value: '"one"',
      },
    );
    expect(missingSourceRes.status).toBe(400);

    const invalidSourceRes = await subject.client.put(
      '/__mocko__/flags/source%3Ainvalid',
      {
        value: '"one"',
        source: 'UNKNOWN',
      },
    );
    expect(invalidSourceRes.status).toBe(400);
  });

  it('supports scoped search and returns prefix counts on __mocko__ routes', async () => {
    subject = await createSubject();

    await setCoreFlag(subject.client, 'internal:test:one', 'one');
    await setCoreFlag(subject.client, 'internal:test:two', 'two');
    await setCoreFlag(subject.client, 'internal:other:one', 'three');

    const searchRes = await subject.client.get(
      '/__mocko__/flags?prefix=internal:&q=test',
    );
    expect(searchRes.status).toBe(200);
    expect(searchRes.data.flagKeys).toEqual([
      expect.objectContaining({
        type: 'PREFIX',
        name: 'test',
        count: 2,
        matchCount: 2,
      }),
    ]);
  });
});
