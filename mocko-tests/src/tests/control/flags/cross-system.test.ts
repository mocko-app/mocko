import { createSubject, MockoInstance, randomPath } from '../../../harness';

describe('control/proxy flags consistency', () => {
  let subject: MockoInstance;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('shows helper-written flags in control list/get', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const setPath = randomPath();
    const readPath = randomPath();
    const flagKey = 'helpers:flow:value';

    await subject.createMock(`
      mock "PUT ${setPath}/{value}" {
        body = "{{setFlag '${flagKey}' request.params.value}}"
      }
      mock "GET ${readPath}" {
        body = "{{getFlag '${flagKey}'}}"
      }
    `);

    const setRes = await subject.client.put(`${setPath}/abc-123`);
    expect(setRes.status).toBe(200);
    expect((await subject.client.get(readPath)).data).toContain('abc-123');

    const listRes = await control.get('/api/flags?prefix=helpers:flow:');
    expect(listRes.status).toBe(200);
    const hasValueFlag = listRes.data.flagKeys.some(
      (item: any) => item.type === 'FLAG' && item.name === 'value',
    );
    expect(hasValueFlag).toBe(true);

    const getRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(getRes.status).toBe(200);
    expect(getRes.data.value).toBe('"abc-123"');
  });

  it('reflects control writes in proxy helpers and back again', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const getPath = randomPath();
    const hasPath = randomPath();
    const delPath = randomPath();
    const flagKey = 'control:flow:enabled';

    await subject.createMock(`
      mock "GET ${getPath}" {
        body = "{{getFlag '${flagKey}'}}"
      }
      mock "GET ${hasPath}" {
        body = "{{#hasFlag '${flagKey}'}}yes{{else}}no{{/hasFlag}}"
      }
      mock "DELETE ${delPath}" {
        body = "{{delFlag '${flagKey}'}}"
      }
    `);

    const createRes = await control.put(
      `/api/flags/${encodeURIComponent(flagKey)}`,
      {
        value: 'true',
      },
    );
    expect(createRes.status).toBe(200);
    expect((await subject.client.get(getPath)).data).toBe(true);
    expect((await subject.client.get(hasPath)).data).toContain('yes');

    const patchRes = await control.put(
      `/api/flags/${encodeURIComponent(flagKey)}`,
      {
        value: 'false',
      },
    );
    expect(patchRes.status).toBe(200);
    expect((await subject.client.get(getPath)).data).toBe(false);

    const proxyDeleteRes = await subject.client.delete(delPath);
    expect(proxyDeleteRes.status).toBe(200);

    const missingRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(missingRes.status).toBe(404);
  });
});
