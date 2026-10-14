import {
  CaptureServer,
  createCaptureServer,
  createSubject,
  MockoInstance,
} from '../../harness';

describe.each(['bar', 'Bar'])(
  'ui host %s overriding file host bar',
  (uiSlug) => {
    let subject: MockoInstance;
    let fileTarget: CaptureServer;
    let uiTarget: CaptureServer;
    let uiHostId: string;

    function control() {
      return subject.ensureControl();
    }

    async function findBarHosts(): Promise<any[]> {
      const res = await control().get('/api/hosts');
      expect(res.status).toBe(200);
      return res.data.filter(
        (host: { slug: string }) => host.slug.toLowerCase() === 'bar',
      );
    }

    beforeAll(async () => {
      fileTarget = await createCaptureServer();
      uiTarget = await createCaptureServer();
      subject = await createSubject({ '--ui': true });

      await subject.createMock(`
        host "bar" {
          source      = "bar.example"
          destination = "${fileTarget.url}"
        }
        mock "GET /bar-mock" {
          host = "bar"
          body = "bar mock"
        }
        mock "GET /bar-proxy" {
          body = "{{proxy '@bar'}}"
        }
        callback "bar-callback" {
          host = "bar"
          path = "/bar-callback"
        }
        mock "POST /trigger-bar-callback" {
          body = "{{callback 'bar-callback'}}{}"
        }
      `);

      const createRes = await control().post('/api/hosts', {
        slug: uiSlug,
        source: 'bar.local',
        destination: uiTarget.url,
      });
      expect(createRes.status).toBe(201);
      uiHostId = createRes.data.id;
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

    it('rejects a second ui host with the same slug in any case', async () => {
      const res = await control().post('/api/hosts', {
        slug: 'BAR',
        source: 'bar-two.local',
      });
      expect(res.status).toBe(409);
      expect(res.data.code).toBe('HOST_SLUG_CONFLICT');
      expect(await findBarHosts()).toHaveLength(2);
    });

    it('lists the file host as shadowed by the ui host', async () => {
      const hosts = await findBarHosts();
      expect(hosts).toHaveLength(2);
      const uiHost = hosts.find((host) => host.id === uiHostId);
      const fileHost = hosts.find((host) => host.id !== uiHostId);
      expect(uiHost.slug).toBe(uiSlug);
      expect(uiHost.annotations).toEqual(['TEMPORARY']);
      expect(fileHost.annotations).toEqual(['READ_ONLY', 'SHADOWED']);

      const uiDetails = await control().get(`/api/hosts/${uiHostId}`);
      expect(uiDetails.data.conflict.role).toBe('active');
      expect(uiDetails.data.conflict.related).toEqual([
        expect.objectContaining({ id: fileHost.id, origin: 'FILE' }),
      ]);

      const fileDetails = await control().get(`/api/hosts/${fileHost.id}`);
      expect(fileDetails.data.conflict.role).toBe('shadowed');
      expect(fileDetails.data.conflict.related).toEqual([
        expect.objectContaining({ id: uiHostId, origin: 'UI' }),
      ]);
    });

    it('proxies {{proxy}} to the ui host destination', async () => {
      const res = await subject.client.get('/bar-proxy');
      expect(res.status).toBe(200);
      expect(uiTarget.requests.map((r) => r.url)).toEqual(['/bar-proxy']);
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('routes the ui host source and ignores the file host source', async () => {
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

    it('binds file mocks targeting the slug to the ui host source', async () => {
      const ui = await subject.client.get('/bar-mock', {
        headers: { Host: 'bar.local' },
      });
      expect(ui.status).toBe(200);
      expect(ui.data).toBe('bar mock');

      const file = await subject.client.get('/bar-mock', {
        headers: { Host: 'bar.example' },
      });
      expect(file.status).toBe(404);
    });

    it('delivers callbacks targeting the slug to the ui host destination', async () => {
      const res = await subject.client.post('/trigger-bar-callback', {});
      expect(res.status).toBe(201);

      await uiTarget.waitForRequests(1);
      expect(uiTarget.requests[0].url).toBe('/bar-callback');
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('restores the file host once the ui host is deleted', async () => {
      const deleteRes = await control().delete(`/api/hosts/${uiHostId}`);
      expect(deleteRes.status).toBe(204);

      const hosts = await findBarHosts();
      expect(hosts).toHaveLength(1);
      expect(hosts[0].annotations).toEqual(['READ_ONLY']);
      const details = await control().get(`/api/hosts/${hosts[0].id}`);
      expect(details.data.conflict).toBeNull();

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

      const uiSource = await subject.client.get('/bar-mock', {
        headers: { Host: 'bar.local' },
      });
      expect(uiSource.status).toBe(404);

      const trigger = await subject.client.post('/trigger-bar-callback', {});
      expect(trigger.status).toBe(201);
      await fileTarget.waitForRequests(3);

      expect(fileTarget.requests.map((r) => r.url).sort()).toEqual([
        '/bar-callback',
        '/bar-proxy',
        '/unmatched',
      ]);
      expect(uiTarget.requests).toHaveLength(0);
    });
  },
);
