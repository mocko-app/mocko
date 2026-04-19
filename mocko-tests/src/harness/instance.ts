import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import axios, { AxiosInstance } from 'axios';
import { buildArgs } from './flags';
import { nextPort } from './port';
import { waitForHealth, waitForStatus, HealthResponse } from './health';

const CLI_BIN = require.resolve('@mocko/cli/bin/main.js');
const WATCHER_BOOTSTRAP_DELAY_MS = 500;
const REMAP_TIMEOUT_MS = 10000;
const CONTROL_START_TIMEOUT_MS = 15000;
const CREATE_MOCK_RETRY_COUNT = 3;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type InstanceOptions = Record<
  string,
  boolean | string | number | undefined
>;

export class MockoInstance {
  readonly client: AxiosInstance;
  readonly control: AxiosInstance | null;
  private proc!: ChildProcess;
  private tempDir!: string;
  private mockCounter = 0;
  private readonly serverPort: number;
  private readonly watchEnabled: boolean;
  private readonly flags: InstanceOptions;
  private readonly extraEnv: NodeJS.ProcessEnv;
  private readonly uiEnabled: boolean;
  private readonly uiPort: number | null;
  private exitCode: number | null = null;
  private intentionallyStopped = false;

  constructor(options: InstanceOptions = {}, env: NodeJS.ProcessEnv = {}) {
    const port = options['--port'] ?? options['-p'];
    this.serverPort = Number(port ?? nextPort());
    this.watchEnabled = Boolean(options['--watch'] || options['-w']);
    this.uiEnabled = Boolean(
      options['--ui'] || options['--ui-port'] || options['-P'],
    );
    const explicitUiPort = options['--ui-port'] ?? options['-P'];
    this.uiPort = null;
    if (this.uiEnabled) {
      this.uiPort = Number(explicitUiPort ?? nextPort());
    }
    this.flags = { ...options };
    this.extraEnv = { ...env };
    if (!port) {
      this.flags['--port'] = this.serverPort;
    }
    if (this.uiEnabled && explicitUiPort == null && this.uiPort !== null) {
      this.flags['--ui-port'] = this.uiPort;
    }

    this.client = axios.create({
      baseURL: `http://127.0.0.1:${this.serverPort}`,
      validateStatus: () => true,
    });
    this.control = null;
    if (this.uiPort !== null) {
      this.control = axios.create({
        baseURL: `http://127.0.0.1:${this.uiPort}`,
        validateStatus: () => true,
      });
    }
  }

  async prepare(): Promise<void> {
    this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mocko-'));
  }

  async start(): Promise<void> {
    const args = buildArgs(this.flags);
    this.proc = spawn(process.execPath, [CLI_BIN, ...args, this.tempDir], {
      env: { ...process.env, ...this.extraEnv, SILENT: 'true' },
      stdio: 'ignore',
    });
    this.proc.on('close', (code) => {
      this.exitCode = code;
    });

    if (this.watchEnabled) {
      await sleep(WATCHER_BOOTSTRAP_DELAY_MS);
    }

    if (this.control) {
      await waitForStatus(
        this.control,
        '/api/health',
        200,
        CONTROL_START_TIMEOUT_MS,
      );
    }

    await waitForHealth(this.client);
  }

  async init(): Promise<void> {
    await this.prepare();
    try {
      await this.start();
    } catch (error) {
      await this.stopProcess();
      await fs.rm(this.tempDir, { recursive: true, force: true });
      throw error;
    }
  }

  hasCrashed(): boolean {
    return !this.intentionallyStopped && this.exitCode !== null;
  }

  get dir(): string {
    return this.tempDir;
  }

  get port(): number {
    return this.serverPort;
  }

  ensureControl(): AxiosInstance {
    if (!this.control) {
      throw new Error(
        'Control client is not available. Start subject with --ui or --ui-port.',
      );
    }

    return this.control;
  }

  async createMock(hcl: string): Promise<string> {
    const filename = path.join(this.tempDir, `mock-${this.mockCounter++}.hcl`);
    await this.writeFileAndWaitForRemap(filename, hcl);
    return filename;
  }

  async writeFileAndWaitForRemap(
    filename: string,
    content: string,
    retryCount = CREATE_MOCK_RETRY_COUNT,
  ): Promise<void> {
    const revision = await this.getRevision();
    await fs.writeFile(filename, content);
    if (!this.watchEnabled) {
      return;
    }

    await this.waitForRevisionAfterWrite(
      filename,
      content,
      revision,
      retryCount,
    );
  }

  async getRevision(): Promise<number> {
    const res = await this.client.get<HealthResponse>('/__mocko__/health');
    return res.data.revision;
  }

  async waitForRemap(
    revision: number,
    timeout = REMAP_TIMEOUT_MS,
  ): Promise<void> {
    if (!this.watchEnabled) {
      return;
    }

    await this.waitForRevision(revision, timeout);
  }

  async stop(): Promise<void> {
    this.intentionallyStopped = true;
    await this.stopProcess();
    await fs.rm(this.tempDir, { recursive: true, force: true });
  }

  private async waitForRevision(
    revision: number,
    timeout: number,
  ): Promise<void> {
    await waitForHealth(this.client, revision + 1, timeout);
  }

  private async waitForRevisionAfterWrite(
    filename: string,
    content: string,
    revision: number,
    retryCount: number,
  ): Promise<void> {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        await this.waitForRevision(revision, REMAP_TIMEOUT_MS);
        return;
      } catch (error) {
        if (attempt === retryCount) {
          throw error;
        }

        await fs.writeFile(filename, content);
        await sleep(WATCHER_BOOTSTRAP_DELAY_MS);
      }
    }
  }

  private async stopProcess(timeout = 5000): Promise<void> {
    if (!this.proc || this.exitCode !== null) {
      return;
    }

    await new Promise<void>((resolve) => {
      let finished = false;
      let timeoutId: NodeJS.Timeout | null = null;
      const done = () => {
        if (finished) {
          return;
        }
        finished = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve();
      };

      this.proc.once('close', () => done());
      this.proc.kill('SIGTERM');

      timeoutId = setTimeout(() => {
        if (this.exitCode === null) {
          this.proc.kill('SIGKILL');
        }
        done();
      }, timeout);
    });
  }
}
