import {
  CaptureServer,
  createCaptureServer,
  createSubject,
  MockoInstance,
} from '../../harness';

type DeployBody = {
  hosts?: Record<string, unknown>[];
  callbacks?: Record<string, unknown>[];
};

describe('ui definitions shadowing file definitions by slug', () => {
  let subject: MockoInstance;
  let fileTarget: CaptureServer;
  let uiTarget: CaptureServer;

  async function deploy(body: DeployBody): Promise<void> {
    const res = await subject.client.post('/__mocko__/deploy', {
      mocks: [],
      hosts: [],
      callbacks: [],
      ...body,
    });
    expect(res.status).toBe(204);
  }

  beforeAll(async () => {
    fileTarget = await createCaptureServer();
    uiTarget = await createCaptureServer();
    subject = await createSubject(
      {},
      {
        DEPLOY_ENDPOINT_ENABLED: 'true',
        MANAGEMENT_AUTH_MODE: 'none',
        DEBUG: 'mocko:logger',
      },
    );
  });

  afterAll(async () => {
    await subject.stop();
    await fileTarget.stop();
    await uiTarget.stop();
  });

  beforeEach(() => {
    fileTarget.clear();
    uiTarget.clear();
  });

  describe('hosts', () => {
    beforeAll(async () => {
      await subject.createMock(`
        host "bar" {
          source      = "bar.example"
          destination = "${fileTarget.url}"
        }
        host "same" {
          source      = "same.local"
          destination = "${fileTarget.url}"
        }
        host "cased" {
          source      = "cased.example"
          destination = "${fileTarget.url}"
        }
        mock "GET /bar-mock" {
          host = "bar"
          body = "bar mock"
        }
        mock "GET /bar-proxy" {
          body = "{{proxy '@bar'}}"
        }
        mock "GET /cased-proxy" {
          body = "{{proxy '@cased'}}"
        }
        callback "bar-callback" {
          host = "bar"
          path = "/bar-callback"
        }
      `);
      await deploy({
        hosts: [
          { slug: 'bar', source: 'bar.local', destination: uiTarget.url },
          { slug: 'same', source: 'same.local', destination: uiTarget.url },
          { slug: 'Cased', source: 'cased.local', destination: uiTarget.url },
        ],
      });
    });

    it('proxies {{proxy}} to the ui host destination', async () => {
      const res = await subject.client.get('/bar-proxy');
      expect(res.status).toBe(200);
      expect(uiTarget.requests.map((r) => r.url)).toEqual(['/bar-proxy']);
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('proxies unmatched requests on the ui host source only', async () => {
      const ui = await subject.client.get('/unmatched', {
        headers: { Host: 'bar.local' },
      });
      expect(ui.status).toBe(200);
      expect(uiTarget.requests.map((r) => r.url)).toEqual(['/unmatched']);

      const file = await subject.client.get('/unmatched', {
        headers: { Host: 'bar.example' },
      });
      expect(file.status).toBe(404);
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('binds mocks targeting the slug to the ui host source', async () => {
      const ui = await subject.client.get('/bar-mock', {
        headers: { Host: 'bar.local' },
      });
      expect(ui.data).toBe('bar mock');

      const file = await subject.client.get('/bar-mock', {
        headers: { Host: 'bar.example' },
      });
      expect(file.status).toBe(404);
    });

    it('delivers callbacks targeting the slug to the ui host destination', async () => {
      const res = await subject.client.post(
        '/__mocko__/callbacks/bar-callback/fire',
        { payload: {} },
      );
      expect(res.status).toBe(202);

      await uiTarget.waitForRequests(1);
      expect(uiTarget.requests[0].url).toBe('/bar-callback');
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('maps a single route when both hosts share a source', async () => {
      expect(subject.getOutput()).not.toContain('Failed to map');

      const res = await subject.client.get('/shared-source', {
        headers: { Host: 'same.local' },
      });
      expect(res.status).toBe(200);
      expect(uiTarget.requests.map((r) => r.url)).toEqual(['/shared-source']);
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('shadows a file host whose slug differs only in case', async () => {
      const proxied = await subject.client.get('/cased-proxy');
      expect(proxied.status).toBe(200);
      expect(uiTarget.requests.map((r) => r.url)).toEqual(['/cased-proxy']);

      const file = await subject.client.get('/unmatched', {
        headers: { Host: 'cased.example' },
      });
      expect(file.status).toBe(404);
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('restores the file host once the ui host is removed', async () => {
      await deploy({});

      const proxied = await subject.client.get('/bar-proxy');
      expect(proxied.status).toBe(200);

      const unmatched = await subject.client.get('/unmatched', {
        headers: { Host: 'bar.example' },
      });
      expect(unmatched.status).toBe(200);

      const mock = await subject.client.get('/bar-mock', {
        headers: { Host: 'bar.example' },
      });
      expect(mock.data).toBe('bar mock');

      expect(fileTarget.requests.map((r) => r.url)).toEqual([
        '/bar-proxy',
        '/unmatched',
      ]);
      expect(uiTarget.requests).toHaveLength(0);
    });
  });

  describe('callbacks', () => {
    beforeAll(async () => {
      await subject.createMock(`
        callback "foo" {
          url = "${fileTarget.url}/foo"
        }
        mock "POST /trigger-foo" {
          body = "{{callback 'foo'}}{}"
        }
      `);
      await deploy({
        callbacks: [{ slug: 'Foo', url: `${uiTarget.url}/foo` }],
      });
    });

    it('triggers the ui callback from {{callback}}', async () => {
      const res = await subject.client.post('/trigger-foo', {});
      expect(res.status).toBe(201);

      await uiTarget.waitForRequests(1);
      expect(uiTarget.requests[0].url).toBe('/foo');
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('fires the ui callback from the management api', async () => {
      const res = await subject.client.post('/__mocko__/callbacks/foo/fire', {
        payload: {},
      });
      expect(res.status).toBe(202);

      await uiTarget.waitForRequests(1);
      expect(uiTarget.requests[0].url).toBe('/foo');
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('restores the file callback once the ui callback is removed', async () => {
      await deploy({});

      const res = await subject.client.post('/__mocko__/callbacks/foo/fire', {
        payload: {},
      });
      expect(res.status).toBe(202);

      await fileTarget.waitForRequests(1);
      expect(fileTarget.requests[0].url).toBe('/foo');
      expect(uiTarget.requests).toHaveLength(0);
    });
  });
});

describe('file definitions sharing a slug', () => {
  let subject: MockoInstance;

  beforeAll(async () => {
    subject = await createSubject();
    await subject.createMock(`
      host "dup" {
        source = "dup-one.local"
      }
      host "Dup" {
        source = "dup-two.local"
      }
      callback "twin" {
        url = "http://localhost:9998/one"
      }
    `);
    await subject.createMock(`
      host "dup" {
        source = "dup-three.local"
      }
      callback "Twin" {
        url = "http://localhost:9998/two"
      }
    `);
  });

  afterAll(async () => {
    await subject.stop();
  });

  it('lists every file host, duplicates included', async () => {
    const res = await subject.client.get('/__mocko__/hosts');
    expect(res.status).toBe(200);
    expect(
      res.data.map((host: { source: string }) => host.source).sort(),
    ).toEqual(['dup-one.local', 'dup-three.local', 'dup-two.local']);
  });

  it('lists every file callback, duplicates included', async () => {
    const res = await subject.client.get('/__mocko__/callbacks');
    expect(res.status).toBe(200);
    expect(
      res.data.map((callback: { url: string }) => callback.url).sort(),
    ).toEqual(['http://localhost:9998/one', 'http://localhost:9998/two']);
  });
});
