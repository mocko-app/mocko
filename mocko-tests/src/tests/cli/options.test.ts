import { createSubject, MockoInstance } from '../../harness';
import { nextPort } from '../../harness/port';

async function createContentOn(port: number): Promise<MockoInstance> {
  const instance = new MockoInstance({ '--watch': true, '--port': port });
  await instance.init();
  return instance;
}

describe('cli options', () => {
  describe('-u / --url flag', () => {
    let subject: MockoInstance;
    let content: MockoInstance;
    let contentPort: number;

    beforeAll(async () => {
      contentPort = nextPort();
      content = await createContentOn(contentPort);
      subject = await createSubject({
        '-u': `http://localhost:${contentPort}`,
      });
    });

    afterAll(async () => {
      await subject.stop();
      await content.stop();
    });

    it('proxies unmatched requests to the upstream', async () => {
      await content.createMock(`
        mock "GET /upstream-only" {
          body = "from upstream"
        }
      `);
      const res = await subject.client.get('/upstream-only');
      expect(res.data).toBe('from upstream');
    });

    it('{{proxy}} with no argument proxies to -u upstream', async () => {
      await content.createMock(`
        mock "GET /no-arg-proxy" {
          body = "from content"
        }
      `);
      await subject.createMock(`
        mock "GET /no-arg-proxy" {
          body = "{{proxy}}"
        }
      `);
      const res = await subject.client.get('/no-arg-proxy');
      expect(res.data).toBe('from content');
    });

    it('still serves defined mocks when -u is set', async () => {
      await subject.createMock(`
        mock "GET /local-mock" {
          body = "local"
        }
      `);
      const res = await subject.client.get('/local-mock');
      expect(res.data).toBe('local');
    });
  });

  describe('-t / --timeout flag', () => {
    let subject: MockoInstance;
    let content: MockoInstance;
    let contentPort: number;

    beforeAll(async () => {
      contentPort = nextPort();
      content = await createContentOn(contentPort);
      subject = await createSubject({ '-t': 100 });
    });

    afterAll(async () => {
      await subject.stop();
      await content.stop();
    });

    it('returns 504 when upstream exceeds timeout', async () => {
      await content.createMock(`
        mock "GET /slow" {
          delay = 200
          body = "slow response"
        }
      `);
      await subject.createMock(`
        mock "GET /slow" {
          body = "{{proxy 'http://localhost:${contentPort}/'}}"
        }
      `);
      const start = Date.now();
      const res = await subject.client.get('/slow');
      const elapsed = Date.now() - start;
      expect(res.status).toBe(504);
      expect(elapsed).toBeLessThan(150);
    });
  });
});
