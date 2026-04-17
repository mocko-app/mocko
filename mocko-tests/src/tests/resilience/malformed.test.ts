import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { MockoInstance } from '../../harness';

async function startWithFile(hcl: string): Promise<MockoInstance> {
  const instance = new MockoInstance({ '--watch': true });
  await instance.prepare();
  await fs.writeFile(path.join(instance.dir, 'test.hcl'), hcl);
  await instance.start();
  return instance;
}

describe('resilience to malformed input', () => {
  describe('invalid HCL syntax', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await startWithFile('this is not valid { hcl syntax !!!');
    });

    afterAll(() => subject.stop());

    it('does not crash on invalid HCL syntax', async () => {
      expect(subject.hasCrashed()).toBe(false);
    });

    it('still serves health endpoint after malformed file', async () => {
      const res = await subject.client.get('/health');
      expect(res.status).toBe(200);
    });
  });

  describe('invalid field values', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await startWithFile(`
        mock "GET /good" {
          body = "ok"
        }
        mock "INVALID_METHOD /bad" {
          body = "bad"
        }
      `);
    });

    afterAll(() => subject.stop());

    it('does not crash on invalid mock field values', async () => {
      expect(subject.hasCrashed()).toBe(false);
    });

    it('still serves health endpoint after file with invalid mock', async () => {
      const res = await subject.client.get('/health');
      expect(res.status).toBe(200);
    });

    it('still serves valid mocks when file also contains invalid ones', async () => {
      const res = await subject.client.get('/good');
      expect(res.status).toBe(200);
    });
  });

  describe('invalid template body', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await startWithFile(`
        mock "GET /good" {
          body = "ok"
        }
        mock "GET /bad-template" {
          body = "{{unclosed"
        }
      `);
    });

    afterAll(() => subject.stop());

    it('does not crash on invalid template body', async () => {
      expect(subject.hasCrashed()).toBe(false);
    });

    it('still serves health endpoint after file with invalid template', async () => {
      const res = await subject.client.get('/health');
      expect(res.status).toBe(200);
    });

    it('still serves valid mocks when file also contains invalid template', async () => {
      const res = await subject.client.get('/good');
      expect(res.status).toBe(200);
    });

    it('returns 500 for the mock with invalid template', async () => {
      const res = await subject.client.get('/bad-template');
      expect(res.status).toBe(500);
    });
  });

  describe('adding malformed file at runtime', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = new MockoInstance({ '--watch': true });
      await subject.init();
    });

    afterAll(() => subject.stop());

    it('does not crash when a malformed file is added while running', async () => {
      await subject.writeFileAndWaitForRemap(
        path.join(subject.dir, 'bad.hcl'),
        'this { is not valid hcl !!!',
      );

      expect(subject.hasCrashed()).toBe(false);
      const res = await subject.client.get('/health');
      expect(res.status).toBe(200);
    });
  });
});
