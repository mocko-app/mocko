import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { createSubject, MockoInstance, randomPath } from '../../harness';

const CLI_BIN = require.resolve('@mocko/cli/bin/main.js');

type ValidateResult = {
  code: number | null;
  stdout: string;
  stderr: string;
  output: string;
};

const tempDirs: string[] = [];

async function writeMocks(files: Record<string, string>): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mocko-validate-'));
  tempDirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(dir, name);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  }
  return dir;
}

function runValidate(...args: string[]): Promise<ValidateResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [CLI_BIN, 'validate', ...args]);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => (stdout += chunk));
    proc.stderr.on('data', (chunk) => (stderr += chunk));
    proc.on('error', reject);
    proc.on('close', (code) =>
      resolve({ code, stdout, stderr, output: stdout + stderr }),
    );
  });
}

afterAll(async () => {
  await Promise.all(
    tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe('mocko validate', () => {
  it('passes on a valid mocks folder', async () => {
    const dir = await writeMocks({
      'users.hcl': `
        mock "GET /users" {
          body = "[]"
        }
      `,
    });
    const result = await runValidate(dir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('No issues found');
    expect(result.stdout).toContain('1 mock across 1 file');
  });

  it('fails on HCL syntax errors with line and column', async () => {
    const dir = await writeMocks({
      'broken.hcl': 'mock "GET /a" {\n  body =\n}\n',
    });
    const result = await runValidate(dir);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain('broken.hcl');
    expect(result.stdout).toMatch(/syntax error at line \d+, column \d+/);
  });

  it('fails on invalid mock definitions', async () => {
    const dir = await writeMocks({
      'bad.hcl': `
        mock "FETCH /nope" {
          body = "x"
        }
      `,
    });
    const result = await runValidate(dir);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain("On mock 'FETCH /nope'");
    expect(result.stdout).toContain('"method" must be one of');
  });

  it('fails on invalid host blocks', async () => {
    const dir = await writeMocks({
      'hosts.hcl': `
        mock "GET /a" {
          body = "x"
        }
        host "bad" {
          source = "not a hostname"
        }
      `,
    });
    const result = await runValidate(dir);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain("On host 'bad'");
  });

  it('fails on duplicated routes attributing both files', async () => {
    const dir = await writeMocks({
      'one.hcl': `
        mock "GET /users" {
          body = "one"
        }
      `,
      'two.hcl': `
        mock "GET /users" {
          body = "two"
        }
      `,
    });
    const result = await runValidate(dir);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain("conflicts with mock 'GET /users'");
    expect(result.stdout).toContain('one.hcl');
    expect(result.stdout).toContain('two.hcl');
  });

  it('does not report conflicts for the same path on different hosts', async () => {
    const dir = await writeMocks({
      'hosts.hcl': `
        mock "GET /users" {
          host = "a.local"
          body = "a"
        }
        mock "GET /users" {
          host = "b.local"
          body = "b"
        }
      `,
    });
    const result = await runValidate(dir);

    expect(result.output).not.toContain('conflicts');
    expect(result.code).toBe(0);
  });

  it('fails on query params in the path with a helpful message', async () => {
    const dir = await writeMocks({
      'query.hcl': `
        mock "GET /users?id=1" {
          body = "x"
        }
      `,
    });
    const result = await runValidate(dir);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain(
      "query parameters can't be part of the path",
    );
    expect(result.stdout).toContain('{{request.query.param}}');
  });

  it('fails on invalid body templates, including disabled mocks', async () => {
    const dir = await writeMocks({
      'templates.hcl': `
        mock "GET /enabled" {
          body = "{{#if x}}unclosed"
        }
        mock "GET /disabled" {
          enabled = false
          body = "{{#each items}}unclosed"
        }
      `,
    });
    const result = await runValidate(dir);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain(
      "mock 'GET /enabled': invalid template body",
    );
    expect(result.stdout).toContain(
      "mock 'GET /disabled': invalid template body",
    );
  });

  it('fails on mocks under the reserved /__mocko__ path', async () => {
    const dir = await writeMocks({
      'reserved.hcl': `
        mock "GET /__mocko__/health" {
          body = "x"
        }
      `,
    });
    const result = await runValidate(dir);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain('reserved');
  });

  it('warns on Express-style path parameters without failing', async () => {
    const dir = await writeMocks({
      'params.hcl': `
        mock "GET /orders/:id" {
          body = "x"
        }
      `,
    });
    const result = await runValidate(dir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Express-style ':param'");
    expect(result.stdout).toContain("'{param}'");
    expect(result.stdout).toContain('0 errors, 1 warning');
  });

  it('warns when a mock references an undefined host', async () => {
    const dir = await writeMocks({
      'hosted.hcl': `
        mock "GET /a" {
          host = "missing"
          body = "x"
        }
      `,
    });
    const result = await runValidate(dir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("references host 'missing'");
  });

  it('fails on warnings when --strict is set', async () => {
    const dir = await writeMocks({
      'params.hcl': `
        mock "GET /orders/:id" {
          body = "x"
        }
      `,
    });
    const result = await runValidate('--strict', dir);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain('failing due to --strict');
  });

  it('fails when the folder has no mocks', async () => {
    const dir = await writeMocks({});
    const result = await runValidate(dir);

    expect(result.code).toBe(1);
    expect(result.stdout).toContain('no mocks found');
  });

  it('fails when the folder does not exist', async () => {
    const result = await runValidate('/tmp/definitely-not-a-mocks-folder');

    expect(result.code).toBe(1);
    expect(result.output).toContain('is not a directory');
  });

  it('fails when no folder is specified', async () => {
    const result = await runValidate();

    expect(result.code).toBe(1);
    expect(result.output).toContain('Specify the mocks folder');
  });

  it('outputs machine-readable diagnostics with --json', async () => {
    const dir = await writeMocks({
      'mixed.hcl': `
        mock "GET /users" {
          body = "[]"
        }
        mock "GET /orders/:id" {
          body = "x"
        }
        mock "GET /broken" {
          body = "{{#if x}}unclosed"
        }
      `,
    });
    const result = await runValidate('--json', dir);

    expect(result.code).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.valid).toBe(false);
    expect(report.errors).toBe(1);
    expect(report.warnings).toBe(1);
    expect(report.mocks).toBe(3);
    expect(report.files).toBe(1);
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'template-parse-error',
        severity: 'error',
        file: 'mixed.hcl',
        mock: 'GET /broken',
      }),
    );
    expect(report.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'suspicious-path',
        severity: 'warning',
        mock: 'GET /orders/:id',
      }),
    );
  });

  describe('startup regression', () => {
    let subject: MockoInstance;

    beforeAll(async () => {
      subject = await createSubject();
    });

    afterAll(async () => {
      await subject.stop();
    });

    it('still warns and skips invalid definitions at startup', async () => {
      const validPath = randomPath();
      await subject.createMock(`
        mock "GET ${validPath}" {
          body = "still up"
        }
        mock "FETCH /invalid-startup" {
          body = "x"
        }
      `);

      const res = await subject.client.get(validPath);
      expect(res.data).toBe('still up');
      expect(subject.hasCrashed()).toBe(false);
    });
  });
});
