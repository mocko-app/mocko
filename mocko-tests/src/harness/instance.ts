import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import axios, { AxiosInstance } from 'axios';
import { buildArgs } from './flags';
import { nextPort } from './port';
import { waitForHealth, HealthResponse } from './health';

const CLI_BIN = require.resolve('@mocko/cli/bin/main.js');

export type InstanceOptions = Record<
  string,
  boolean | string | number | undefined
>;

export class MockoInstance {
  readonly client: AxiosInstance;
  private proc!: ChildProcess;
  private tempDir!: string;
  private mockCounter = 0;
  private readonly port: number;
  private readonly watchEnabled: boolean;
  private readonly flags: InstanceOptions;

  constructor(options: InstanceOptions = {}) {
    const port = options['--port'] ?? options['-p'];
    this.port = Number(port ?? nextPort());
    this.watchEnabled = Boolean(options['--watch'] || options['-w']);
    this.flags = { ...options };
    if (!port) {
      this.flags['--port'] = this.port;
    }
    this.client = axios.create({
      baseURL: `http://localhost:${this.port}`,
      validateStatus: () => true,
    });
  }

  async init(): Promise<void> {
    this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mocko-'));
    const args = buildArgs(this.flags);
    this.proc = spawn('node', [CLI_BIN, ...args, this.tempDir], {
      env: { ...process.env, SILENT: 'true' },
      stdio: 'ignore',
    });
    await waitForHealth(this.client);
  }

  get dir(): string {
    return this.tempDir;
  }

  async createMock(hcl: string): Promise<void> {
    const res = await this.client.get<HealthResponse>('/health');
    const revision = res.data.revision;
    const filename = path.join(this.tempDir, `mock-${this.mockCounter++}.hcl`);
    await fs.writeFile(filename, hcl);
    if (this.watchEnabled) {
      await waitForHealth(this.client, revision + 1, 2000);
    }
  }

  async stop(): Promise<void> {
    this.proc.kill();
    await fs.rm(this.tempDir, { recursive: true, force: true });
  }
}
