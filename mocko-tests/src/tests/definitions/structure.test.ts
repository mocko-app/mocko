import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createSubject, MockoInstance, randomPath } from '../../harness';

describe('definition structure', () => {
  describe('multiple mocks in one file', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await createSubject();
      await subject.createMock(`
        mock "GET /multi-1" {
          body = "one"
        }
        mock "GET /multi-2" {
          body = "two"
        }
        mock "GET /multi-3" {
          body = "three"
        }
      `);
    });

    afterAll(() => subject.stop());

    it('loads all mocks from a single file', async () => {
      expect((await subject.client.get('/multi-1')).data).toBe('one');
      expect((await subject.client.get('/multi-2')).data).toBe('two');
      expect((await subject.client.get('/multi-3')).data).toBe('three');
    });
  });

  describe('multiple hosts in one file', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await createSubject();
      await subject.createMock(`
        host "v1" {
          source      = "v1.local"
          destination = "http://localhost:9998/v1"
        }
        host "v2" {
          source      = "v2.local"
          destination = "http://localhost:9998/v2"
        }
        mock "GET /hosts-loaded" {
          body = "ok"
        }
      `);
    });

    afterAll(() => subject.stop());

    it('loads multiple hosts from one file without crashing', async () => {
      const res = await subject.client.get('/hosts-loaded');
      expect(res.status).toBe(200);
    });

    it('supports host names, omitted names, and empty names without crashing', async () => {
      await subject.createMock(`
        host "named-host" {
          name        = "Named host"
          source      = "named-host.local"
          destination = "http://localhost:9998/named"
        }
        host "empty-host-name" {
          name        = ""
          source      = "empty-host-name.local"
          destination = "http://localhost:9998/empty"
        }
        host "unnamed-host" {
          source      = "unnamed-host.local"
          destination = "http://localhost:9998/unnamed"
        }
        mock "GET /host-name-loading" {
          body = "ok"
        }
      `);

      const res = await subject.client.get('/host-name-loading');
      expect(res.status).toBe(200);
    });
  });

  describe('mixed mock and host blocks in one file', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await createSubject();
      await subject.createMock(`
        host "upstream" {
          source      = "upstream.local"
          destination = "http://localhost:9997"
        }
        mock "GET /mixed-mock" {
          body = "from mixed file"
        }
      `);
    });

    afterAll(() => subject.stop());

    it('loads mock from file that also contains host blocks', async () => {
      const res = await subject.client.get('/mixed-mock');
      expect(res.data).toBe('from mixed file');
    });
  });

  describe('nested folders', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await createSubject();
      const deepDir = path.join(subject.dir, 'a', 'b', 'c');
      const deepFile = path.join(deepDir, 'deep.hcl');
      const deepMock = `mock "GET /deep-nested" { body = "deep" }`;
      await fs.mkdir(deepDir, { recursive: true });
      await subject.writeFileAndWaitForRemap(deepFile, deepMock);
    });

    afterAll(() => subject.stop());

    it('loads mocks from deeply nested subdirectories', async () => {
      const res = await subject.client.get('/deep-nested');
      expect(res.data).toBe('deep');
    });
  });

  describe('mocks spread across multiple files', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await createSubject();
      await subject.createMock(`
        mock "GET /file-a" {
          body = "file a"
        }
      `);
      await subject.createMock(`
        mock "GET /file-b" {
          body = "file b"
        }
      `);
    });

    afterAll(() => subject.stop());

    it('loads mocks from multiple separate files', async () => {
      expect((await subject.client.get('/file-a')).data).toBe('file a');
      expect((await subject.client.get('/file-b')).data).toBe('file b');
    });
  });

  describe('resilience', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await createSubject();
    });

    afterAll(() => subject.stop());

    it('does not crash on an empty file', async () => {
      await subject.createMock('');
      const res = await subject.client.get('/__mocko__/health');
      expect(res.status).toBe(200);
    });

    it('does not crash on a comments-only file', async () => {
      await subject.createMock('# just a comment');
      const res = await subject.client.get('/__mocko__/health');
      expect(res.status).toBe(200);
    });

    it('does not crash on duplicate routes', async () => {
      const route = randomPath();
      await subject.createMock(`mock "GET ${route}" { body = "first" }`);
      await subject.createMock(`mock "GET ${route}" { body = "second" }`);
      const res = await subject.client.get('/__mocko__/health');
      expect(res.status).toBe(200);
    });

    it('serves one of the duplicates without error', async () => {
      const route = randomPath();
      await subject.createMock(`mock "GET ${route}" { body = "first" }`);
      await subject.createMock(`mock "GET ${route}" { body = "second" }`);
      const res = await subject.client.get(route);
      expect(res.status).toBe(200);
      expect(['first', 'second']).toContain(res.data);
    });
  });
});
