import {
  CaptureServer,
  createCaptureServer,
  createSubject,
  MockoInstance,
  randomPath,
} from '../../harness';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('mock-triggered callbacks (storeless)', () => {
  let subject: MockoInstance;
  let capture: CaptureServer;

  beforeAll(async () => {
    capture = await createCaptureServer();
    subject = await createSubject();
    await subject.createMock(`
      host "target" {
        source      = "target.local"
        destination = "${capture.url}"
      }

      callback "payment-approved" {
        host = "target"
        path = "/payments/{{payload.key}}"
        body = "{ \\"key\\": \\"{{payload.key}}\\", \\"type\\": \\"{{payload.type}}\\" }"
      }

      callback "slow" {
        host  = "target"
        path  = "/slow/{{payload}}"
        delay = 60000
        body  = "{}"
      }

      callback "stanza-delay" {
        host  = "target"
        path  = "/stanza-delay"
        delay = 800
        body  = "{}"
      }
    `);
  });

  afterAll(async () => {
    await subject.stop();
    await capture.stop();
  });

  beforeEach(async () => {
    capture.clear();
    await subject.client.delete('/__mocko__/callbacks/pending');
  });

  it('delivers a callback triggered by a mock', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "POST ${path}" {
        body = "{{callback 'payment-approved' (object key=request.body.key type='EMAIL')}}{ \\"ok\\": true }"
      }
    `);

    const res = await subject.client.post(path, { key: 'jane.doe@mocko.dev' });
    expect(res.status).toBe(201);
    expect(res.data).toEqual({ ok: true });

    await capture.waitForRequests(1);
    const [request] = capture.requests;
    expect(request.method).toBe('POST');
    expect(request.url).toBe('/payments/jane.doe@mocko.dev');
    expect(JSON.parse(request.body)).toEqual({
      key: 'jane.doe@mocko.dev',
      type: 'EMAIL',
    });
  });

  it('prefers the helper delay over the stanza delay', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{callback 'slow' 'overridden' delay=1234}}scheduled"
      }
    `);

    await subject.client.get(path);

    const pending = await subject.client.get('/__mocko__/callbacks/pending');
    expect(pending.data).toHaveLength(1);
    expect(pending.data[0].dueAt - pending.data[0].createdAt).toBe(1234);
  });

  it('falls back to the stanza delay when the helper omits it', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{callback 'stanza-delay'}}scheduled"
      }
    `);

    await subject.client.get(path);

    const pending = await subject.client.get('/__mocko__/callbacks/pending');
    expect(pending.data).toHaveLength(1);
    expect(pending.data[0].dueAt - pending.data[0].createdAt).toBe(800);
  });

  it('responds 500 when triggering an unknown callback slug', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{callback 'nope'}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.status).toBe(500);

    const pending = await subject.client.get('/__mocko__/callbacks/pending');
    expect(pending.data).toHaveLength(0);
    await sleep(500);
    expect(capture.requests).toHaveLength(0);
  });

  it('enqueues only after the mock delay, not at render time', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        delay = 400
        body  = "{{callback 'payment-approved' (object key='after-response')}}done"
      }
    `);

    const request = subject.client.get(path);
    await sleep(250);
    expect(capture.requests).toHaveLength(0);

    const res = await request;
    expect(res.status).toBe(200);

    await capture.waitForRequests(1);
    expect(capture.requests[0].url).toBe('/payments/after-response');
  });

  it('fires callbacks triggered by a mock that proxies', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{callback 'payment-approved' (object key='proxied')}}{{proxy '@target'}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({});

    await capture.waitForRequests(2);
    const proxied = capture.requests.find(
      (request) => request.method === 'GET',
    );
    const delivered = capture.requests.find(
      (request) => request.method === 'POST',
    );
    expect(proxied?.url).toBe(path);
    expect(delivered?.url).toBe('/payments/proxied');
  });

  it('enqueues nothing when the template fails after the helper ran', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{callback 'payment-approved' (object key='never')}}{{getFlag 5}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.status).toBe(500);

    const pending = await subject.client.get('/__mocko__/callbacks/pending');
    expect(pending.data).toHaveLength(0);
    await sleep(500);
    expect(capture.requests).toHaveLength(0);
  });

  it('responds 500 for an invalid helper delay', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{callback 'slow' delay=-5}}"
      }
    `);

    const res = await subject.client.get(path);
    expect(res.status).toBe(500);

    const pending = await subject.client.get('/__mocko__/callbacks/pending');
    expect(pending.data).toHaveLength(0);
  });

  it('records the triggering mock id on the pending entry', async () => {
    const path = randomPath();
    await subject.createMock(`
      mock "GET ${path}" {
        body = "{{callback 'slow' 'later'}}scheduled"
      }
    `);

    await subject.client.get(path);

    const mocks = await subject.client.get('/__mocko__/mocks');
    const mock = mocks.data.find((item: any) => item.path === path);
    expect(mock).toBeDefined();

    const pending = await subject.client.get('/__mocko__/callbacks/pending');
    expect(pending.data).toHaveLength(1);
    expect(pending.data[0].slug).toBe('slow');
    expect(pending.data[0].payload).toBe('later');
    expect(pending.data[0].triggeredByMockId).toBe(mock.id);
  });
});
