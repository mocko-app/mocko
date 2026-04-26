import { createSubject, MockoInstance } from '../../../harness';

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

    const createRes = await subject.client.put(
      '/__mocko__/flags/internal%3Atest%3Aflag',
      {
        value: '"one"',
      },
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

    const patchRes = await subject.client.put(
      '/__mocko__/flags/internal%3Atest%3Aflag',
      {
        value: '"two"',
      },
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

  it('supports scoped search and returns prefix counts on __mocko__ routes', async () => {
    subject = await createSubject();

    await subject.client.put('/__mocko__/flags/internal%3Atest%3Aone', {
      value: '"one"',
    });
    await subject.client.put('/__mocko__/flags/internal%3Atest%3Atwo', {
      value: '"two"',
    });
    await subject.client.put('/__mocko__/flags/internal%3Aother%3Aone', {
      value: '"three"',
    });

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
