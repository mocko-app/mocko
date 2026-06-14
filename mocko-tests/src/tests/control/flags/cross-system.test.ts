import {
  createSubject,
  MockoInstance,
  randomPath,
  setControlFlag,
} from '../../../harness';

describe('control/proxy flags consistency', () => {
  let subject: MockoInstance;

  afterEach(async () => {
    if (subject) {
      await subject.stop();
    }
  });

  it('should write strings on core and read everywhere', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const setPath = randomPath();
    const readPath = randomPath();
    const flagKey = 'core:flow:str';

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

    let listRes = await control.get('/api/flags');
    expect(listRes.status).toBe(200);
    const hasFirstPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'core',
    );
    expect(hasFirstPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=core:');
    expect(listRes.status).toBe(200);
    const hasSecondPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'flow',
    );
    expect(hasSecondPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=core:flow:');
    expect(listRes.status).toBe(200);
    const hasValueFlag = listRes.data.flagKeys.some(
      (item: any) => item.type === 'FLAG' && item.name === 'str',
    );
    expect(hasValueFlag).toBe(true);

    const controlGetRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(controlGetRes.status).toBe(200);
    expect(controlGetRes.data.value).toBe('"abc-123"');

    const subjectGetRes = await subject.client.get(readPath);
    expect(subjectGetRes.status).toBe(200);
    expect(subjectGetRes.data).toBe('abc-123');
  });

  it('should write numbers on core and read everywhere', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const setPath = randomPath();
    const readPath = randomPath();
    const flagKey = 'core:flow:num';

    await subject.createMock(`
      mock "PUT ${setPath}" {
        body = "{{setFlag '${flagKey}' request.body.value}}"
      }
      mock "GET ${readPath}" {
        body = "num: {{getFlag '${flagKey}'}}"
      }
    `);

    const setRes = await subject.client.put(`${setPath}`, { value: 42 });
    expect(setRes.status).toBe(200);

    let listRes = await control.get('/api/flags');
    expect(listRes.status).toBe(200);
    const hasFirstPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'core',
    );
    expect(hasFirstPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=core:');
    expect(listRes.status).toBe(200);
    const hasSecondPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'flow',
    );
    expect(hasSecondPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=core:flow:');
    expect(listRes.status).toBe(200);
    const hasValueFlag = listRes.data.flagKeys.some(
      (item: any) => item.type === 'FLAG' && item.name === 'num',
    );
    expect(hasValueFlag).toBe(true);

    const controlGetRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(controlGetRes.status).toBe(200);
    expect(controlGetRes.data.value).toBe('42');

    const subjectGetRes = await subject.client.get(readPath);
    expect(subjectGetRes.status).toBe(200);
    expect(subjectGetRes.data).toBe('num: 42');
  });

  it('should write objects on core and read everywhere', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const setPath = randomPath();
    const readPath = randomPath();
    const flagKey = 'core:flow:obj';

    await subject.createMock(`
      mock "PUT ${setPath}" {
        body = "{{setFlag '${flagKey}' request.body}}"
      }
      mock "GET ${readPath}" {
        body = "num: {{pick (getFlag '${flagKey}') 'value'}}"
      }
    `);

    const setRes = await subject.client.put(`${setPath}`, { value: 42 });
    expect(setRes.status).toBe(200);

    let listRes = await control.get('/api/flags');
    expect(listRes.status).toBe(200);
    const hasFirstPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'core',
    );
    expect(hasFirstPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=core:');
    expect(listRes.status).toBe(200);
    const hasSecondPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'flow',
    );
    expect(hasSecondPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=core:flow:');
    expect(listRes.status).toBe(200);
    const hasValueFlag = listRes.data.flagKeys.some(
      (item: any) => item.type === 'FLAG' && item.name === 'obj',
    );
    expect(hasValueFlag).toBe(true);

    const controlGetRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(controlGetRes.status).toBe(200);
    expect(controlGetRes.data.value).toBe('{"value":42}');

    const subjectGetRes = await subject.client.get(readPath);
    expect(subjectGetRes.status).toBe(200);
    expect(subjectGetRes.data).toBe('num: 42');
  });

  it('should write strings on control and read everywhere', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const getPath = randomPath();
    const flagKey = 'control:flow:str';

    await subject.createMock(`
      mock "GET ${getPath}" {
        body = "{{getFlag '${flagKey}'}}"
      }
    `);

    const createRes = await setControlFlag(control, flagKey, 'foo');
    expect(createRes.status).toBe(200);

    let listRes = await control.get('/api/flags');
    expect(listRes.status).toBe(200);
    const hasFirstPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'control',
    );
    expect(hasFirstPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=control:');
    expect(listRes.status).toBe(200);
    const hasSecondPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'flow',
    );
    expect(hasSecondPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=control:flow:');
    expect(listRes.status).toBe(200);
    const hasValueFlag = listRes.data.flagKeys.some(
      (item: any) => item.type === 'FLAG' && item.name === 'str',
    );
    expect(hasValueFlag).toBe(true);

    const controlGetRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(controlGetRes.status).toBe(200);
    expect(controlGetRes.data.value).toBe('"foo"');

    const subjectGetRes = await subject.client.get(getPath);
    expect(subjectGetRes.status).toBe(200);
    expect(subjectGetRes.data).toBe('foo');
  });

  it('should write numbers on control and read everywhere', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const getPath = randomPath();
    const flagKey = 'control:flow:num';

    await subject.createMock(`
      mock "GET ${getPath}" {
        body = "num: {{getFlag '${flagKey}'}}"
      }
    `);

    const createRes = await setControlFlag(control, flagKey, 42);
    expect(createRes.status).toBe(200);

    let listRes = await control.get('/api/flags');
    expect(listRes.status).toBe(200);
    const hasFirstPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'control',
    );
    expect(hasFirstPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=control:');
    expect(listRes.status).toBe(200);
    const hasSecondPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'flow',
    );
    expect(hasSecondPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=control:flow:');
    expect(listRes.status).toBe(200);
    const hasValueFlag = listRes.data.flagKeys.some(
      (item: any) => item.type === 'FLAG' && item.name === 'num',
    );
    expect(hasValueFlag).toBe(true);

    const controlGetRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(controlGetRes.status).toBe(200);
    expect(controlGetRes.data.value).toBe('42');

    const subjectGetRes = await subject.client.get(getPath);
    expect(subjectGetRes.status).toBe(200);
    expect(subjectGetRes.data).toBe('num: 42');
  });

  it('should write objects on control and read everywhere', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const getPath = randomPath();
    const flagKey = 'control:flow:obj';

    await subject.createMock(`
      mock "GET ${getPath}" {
        body = "num: {{pick (getFlag '${flagKey}') 'value'}}"
      }
    `);

    const createRes = await setControlFlag(control, flagKey, { value: 42 });
    expect(createRes.status).toBe(200);

    let listRes = await control.get('/api/flags');
    expect(listRes.status).toBe(200);
    const hasFirstPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'control',
    );
    expect(hasFirstPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=control:');
    expect(listRes.status).toBe(200);
    const hasSecondPrefix = listRes.data.flagKeys.some(
      (item: any) => item.type === 'PREFIX' && item.name === 'flow',
    );
    expect(hasSecondPrefix).toBe(true);

    listRes = await control.get('/api/flags?prefix=control:flow:');
    expect(listRes.status).toBe(200);
    const hasValueFlag = listRes.data.flagKeys.some(
      (item: any) => item.type === 'FLAG' && item.name === 'obj',
    );
    expect(hasValueFlag).toBe(true);

    const controlGetRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(controlGetRes.status).toBe(200);
    expect(controlGetRes.data.value).toBe('{"value":42}');

    const subjectGetRes = await subject.client.get(getPath);
    expect(subjectGetRes.status).toBe(200);
    expect(subjectGetRes.data).toBe('num: 42');
  });

  it('should keep null flags as existing when written by mocks', async () => {
    subject = await createSubject({ '--ui': true });
    const control = subject.ensureControl();
    const setPath = randomPath();
    const hasPath = randomPath();
    const flagKey = 'mock:flow:null';

    await subject.createMock(`
      mock "PUT ${setPath}" {
        body = "{{setFlag '${flagKey}' request.body.value}}"
      }
      mock "GET ${hasPath}" {
        body = "{{#hasFlag '${flagKey}'}}yes{{else}}no{{/hasFlag}}"
      }
    `);

    const writeRes = await subject.client.put(setPath, { value: null });
    expect(writeRes.status).toBe(200);

    const controlGetRes = await control.get(
      `/api/flags/${encodeURIComponent(flagKey)}`,
    );
    expect(controlGetRes.status).toBe(200);
    expect(controlGetRes.data.value).toBe('null');

    const hasRes = await subject.client.get(hasPath);
    expect(hasRes.status).toBe(200);
    expect(hasRes.data).toBe('yes');
  });
});
