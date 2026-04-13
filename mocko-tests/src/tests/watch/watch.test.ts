import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createSubject, MockoInstance } from '../../harness';

describe('watch mode', () => {
  describe('watch enabled', () => {
    let subject: MockoInstance;

    beforeEach(async () => {
      subject = await createSubject();
    });

    afterEach(async () => {
      await subject.stop();
    });

    it('hot-reloads when a new file is added', async () => {
      const filePath = path.join(subject.dir, 'watch-add.hcl');
      await subject.writeFileAndWaitForRemap(
        filePath,
        `mock "GET /watch-add" { body = "added" }`,
      );

      const res = await subject.client.get('/watch-add');
      expect(res.data).toBe('added');
    });

    it('hot-reloads when a file is edited', async () => {
      const filePath = path.join(subject.dir, 'watch-edit.hcl');

      await subject.writeFileAndWaitForRemap(
        filePath,
        `mock "GET /watch-edit" { body = "original" }`,
      );
      expect((await subject.client.get('/watch-edit')).data).toBe('original');

      await subject.writeFileAndWaitForRemap(
        filePath,
        `mock "GET /watch-edit" { body = "updated" }`,
      );
      expect((await subject.client.get('/watch-edit')).data).toBe('updated');
    });

    it('hot-reloads when a file is deleted', async () => {
      const filePath = path.join(subject.dir, 'watch-delete.hcl');

      let rev = await subject.getRevision();
      await fs.writeFile(
        filePath,
        `mock "GET /watch-delete" { body = "exists" }`,
      );
      await subject.waitForRemap(rev);
      expect((await subject.client.get('/watch-delete')).status).toBe(200);

      rev = await subject.getRevision();
      await fs.unlink(filePath);
      await subject.waitForRemap(rev);
      expect((await subject.client.get('/watch-delete')).status).toBe(404);
    });
  });
});
