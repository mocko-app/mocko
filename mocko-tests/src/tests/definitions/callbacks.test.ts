import { createSubject, MockoInstance } from '../../harness';

type CallbackDto = {
  slug: string;
  name?: string;
  method: string;
  host?: string;
  path?: string;
  url?: string;
  delay: number;
  headers: Record<string, string>;
  body?: string;
  filePath?: string;
};

async function listCallbacks(subject: MockoInstance): Promise<CallbackDto[]> {
  const res = await subject.client.get<CallbackDto[]>('/__mocko__/callbacks');
  expect(res.status).toBe(200);
  return res.data;
}

function bySlug(
  callbacks: CallbackDto[],
  slug: string,
): CallbackDto | undefined {
  return callbacks.find((callback) => callback.slug === slug);
}

describe('callback definitions', () => {
  describe('loading callback stanzas', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await createSubject();
      await subject.createMock(`
        host "workflows" {
          source      = "workflows.local"
          destination = "http://localhost:9998"
        }

        callback "pix-created" {
          name   = "PIX key created"
          method = "PUT"
          host   = "workflows"
          path   = "/pix/callbacks/{{payload.key}}"
          delay  = 2000
          headers {
            X-Source = "mocko"
          }
          body = "{ \\"key\\": \\"{{payload.key}}\\" }"
        }

        callback "minimal" {
          host = "workflows"
          path = "/minimal"
        }

        callback "absolute" {
          url = "http://localhost:9998/absolute/{{payload.id}}"
        }
      `);
    });

    afterAll(() => subject.stop());

    it('exposes a full stanza through GET /__mocko__/callbacks', async () => {
      const callback = bySlug(await listCallbacks(subject), 'pix-created');

      expect(callback).toMatchObject({
        slug: 'pix-created',
        name: 'PIX key created',
        method: 'PUT',
        host: 'workflows',
        path: '/pix/callbacks/{{payload.key}}',
        delay: 2000,
        headers: { 'X-Source': 'mocko' },
      });
      expect(callback?.body).toContain('{{payload.key}}');
      expect(callback?.filePath).toMatch(/\.hcl$/);
    });

    it('defaults method to POST, delay to 0 and headers to empty', async () => {
      const callback = bySlug(await listCallbacks(subject), 'minimal');

      expect(callback).toMatchObject({
        slug: 'minimal',
        method: 'POST',
        delay: 0,
        headers: {},
      });
    });

    it('supports absolute url targets', async () => {
      const callback = bySlug(await listCallbacks(subject), 'absolute');

      expect(callback).toMatchObject({
        slug: 'absolute',
        url: 'http://localhost:9998/absolute/{{payload.id}}',
      });
      expect(callback?.host).toBeUndefined();
    });
  });

  describe('invalid callback stanzas', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await createSubject();
      await subject.createMock(`
        host "workflows" {
          source      = "workflows.local"
          destination = "http://localhost:9998"
        }

        callback "both-targets" {
          host = "workflows"
          path = "/x"
          url  = "http://localhost:9998/x"
        }

        callback "no-target" {
          delay = 100
        }

        callback "path-without-host" {
          path = "/x"
        }

        callback "bad-method" {
          method = "FETCH"
          host   = "workflows"
          path   = "/x"
        }

        callback "bad-template" {
          host = "workflows"
          path = "/x"
          body = "{{payload.key"
        }

        callback "negative-delay" {
          host  = "workflows"
          path  = "/x"
          delay = -1
        }

        callback "still-valid" {
          host = "workflows"
          path = "/valid"
        }
      `);
    });

    afterAll(() => subject.stop());

    it('skips invalid stanzas but keeps valid ones from the same file', async () => {
      const callbacks = await listCallbacks(subject);
      const slugs = callbacks.map((callback) => callback.slug);

      expect(slugs).toContain('still-valid');
      expect(slugs).not.toContain('both-targets');
      expect(slugs).not.toContain('no-target');
      expect(slugs).not.toContain('path-without-host');
      expect(slugs).not.toContain('bad-method');
      expect(slugs).not.toContain('bad-template');
      expect(slugs).not.toContain('negative-delay');
    });

    it('does not crash the instance', async () => {
      const res = await subject.client.get('/__mocko__/health');
      expect(res.status).toBe(200);
      expect(subject.hasCrashed()).toBe(false);
    });
  });
});
