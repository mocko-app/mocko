import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createSubject, eventually, MockoInstance } from '../../harness';

describe('watch mode', () => {
  describe('watch enabled', () => {
    let subject: MockoInstance;

    beforeEach(async () => {
      subject = await createSubject();
    });

    afterEach(async () => {
      await subject.stop();
    });

    async function expectServed(route: string, body: string): Promise<void> {
      await eventually(async () => {
        expect((await subject.client.get(route)).data).toBe(body);
      });
    }

    it('hot-reloads when a new file is added', async () => {
      await fs.writeFile(
        path.join(subject.dir, 'watch-add.hcl'),
        `mock "GET /watch-add" { body = "added" }`,
      );

      await expectServed('/watch-add', 'added');
    });

    it('hot-reloads when a file is edited', async () => {
      const filePath = path.join(subject.dir, 'watch-edit.hcl');

      await fs.writeFile(
        filePath,
        `mock "GET /watch-edit" { body = "original" }`,
      );
      await expectServed('/watch-edit', 'original');

      await fs.writeFile(
        filePath,
        `mock "GET /watch-edit" { body = "updated" }`,
      );
      await expectServed('/watch-edit', 'updated');
    });

    it('hot-reloads when a file is deleted', async () => {
      const filePath = path.join(subject.dir, 'watch-delete.hcl');

      await fs.writeFile(
        filePath,
        `mock "GET /watch-delete" { body = "exists" }`,
      );
      await expectServed('/watch-delete', 'exists');

      await fs.unlink(filePath);
      await eventually(async () => {
        expect((await subject.client.get('/watch-delete')).status).toBe(404);
      });
    });
  });
});
