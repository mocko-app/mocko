import {
  CaptureServer,
  createCaptureServer,
  createSubject,
  MockoInstance,
} from '../../harness';

describe.each(['foo', 'Foo'])(
  'ui callback %s overriding file callback foo',
  (uiSlug) => {
    let subject: MockoInstance;
    let fileTarget: CaptureServer;
    let uiTarget: CaptureServer;
    let uiCallbackId: string;

    function control() {
      return subject.ensureControl();
    }

    async function findFooCallbacks(): Promise<any[]> {
      const res = await control().get('/api/callbacks');
      expect(res.status).toBe(200);
      return res.data.filter(
        (callback: { slug: string }) => callback.slug.toLowerCase() === 'foo',
      );
    }

    async function findFileCallbackId(): Promise<string> {
      const callbacks = await findFooCallbacks();
      const fileCallback = callbacks.find((callback) =>
        callback.annotations.includes('READ_ONLY'),
      );
      expect(fileCallback).toBeTruthy();
      return fileCallback.id;
    }

    beforeAll(async () => {
      fileTarget = await createCaptureServer();
      uiTarget = await createCaptureServer();
      subject = await createSubject({ '--ui': true });

      await subject.createMock(`
        callback "foo" {
          url = "${fileTarget.url}/from-file"
        }
        mock "POST /trigger-foo" {
          body = "{{callback 'foo'}}{}"
        }
      `);

      const createRes = await control().post('/api/callbacks', {
        slug: uiSlug,
        url: `${uiTarget.url}/from-ui`,
      });
      expect(createRes.status).toBe(201);
      uiCallbackId = createRes.data.id;
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

    it('rejects a second ui callback with the same slug in any case', async () => {
      const res = await control().post('/api/callbacks', {
        slug: 'FOO',
        url: `${uiTarget.url}/second`,
      });
      expect(res.status).toBe(409);
      expect(res.data.code).toBe('CALLBACK_SLUG_CONFLICT');
      expect(await findFooCallbacks()).toHaveLength(2);
    });

    it('lists the file callback as shadowed by the ui callback', async () => {
      const callbacks = await findFooCallbacks();
      expect(callbacks).toHaveLength(2);
      const uiCallback = callbacks.find(
        (callback) => callback.id === uiCallbackId,
      );
      const fileCallback = callbacks.find(
        (callback) => callback.id !== uiCallbackId,
      );
      expect(uiCallback.slug).toBe(uiSlug);
      expect(uiCallback.annotations).toEqual(['TEMPORARY']);
      expect(fileCallback.annotations).toEqual(['READ_ONLY', 'SHADOWED']);

      const uiDetails = await control().get(`/api/callbacks/${uiCallbackId}`);
      expect(uiDetails.data.conflict.role).toBe('active');
      expect(uiDetails.data.conflict.related).toEqual([
        expect.objectContaining({ id: fileCallback.id, origin: 'FILE' }),
      ]);

      const fileDetails = await control().get(
        `/api/callbacks/${fileCallback.id}`,
      );
      expect(fileDetails.data.conflict.role).toBe('shadowed');
      expect(fileDetails.data.conflict.related).toEqual([
        expect.objectContaining({ id: uiCallbackId, origin: 'UI' }),
      ]);
    });

    it('delivers {{callback}} from a file mock to the ui callback', async () => {
      const res = await subject.client.post('/trigger-foo', {});
      expect(res.status).toBe(201);

      await uiTarget.waitForRequests(1);
      expect(uiTarget.requests[0].url).toBe('/from-ui');
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('fires the ui callback and refuses to fire the shadowed file callback', async () => {
      const fileRes = await control().post(
        `/api/callbacks/${await findFileCallbackId()}/fire`,
        {},
      );
      expect(fileRes.status).toBe(409);
      expect(fileRes.data.code).toBe('CALLBACK_SHADOWED');

      const uiRes = await control().post(
        `/api/callbacks/${uiCallbackId}/fire`,
        {},
      );
      expect(uiRes.status).toBe(202);
      await uiTarget.waitForRequests(1);
      expect(uiTarget.requests.map((r) => r.url)).toEqual(['/from-ui']);
      expect(fileTarget.requests).toHaveLength(0);
    });

    it('restores the file callback once the ui callback is deleted', async () => {
      const deleteRes = await control().delete(
        `/api/callbacks/${uiCallbackId}`,
      );
      expect(deleteRes.status).toBe(204);

      const callbacks = await findFooCallbacks();
      expect(callbacks).toHaveLength(1);
      expect(callbacks[0].annotations).toEqual(['READ_ONLY']);
      const details = await control().get(`/api/callbacks/${callbacks[0].id}`);
      expect(details.data.conflict).toBeNull();

      const trigger = await subject.client.post('/trigger-foo', {});
      expect(trigger.status).toBe(201);

      const fireRes = await control().post(
        `/api/callbacks/${callbacks[0].id}/fire`,
        {},
      );
      expect(fireRes.status).toBe(202);

      await fileTarget.waitForRequests(2);
      expect(fileTarget.requests.map((r) => r.url)).toEqual([
        '/from-file',
        '/from-file',
      ]);
      expect(uiTarget.requests).toHaveLength(0);
    });
  },
);
