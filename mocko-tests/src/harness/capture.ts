import * as http from 'node:http';
import { AddressInfo } from 'node:net';

export type CapturedRequest = {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class CaptureServer {
  readonly requests: CapturedRequest[] = [];
  private server!: http.Server;
  private serverPort!: number;

  async start(): Promise<CaptureServer> {
    this.server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        this.requests.push({
          method: req.method ?? '',
          url: req.url ?? '',
          headers: req.headers,
          body,
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{}');
      });
    });

    await new Promise<void>((resolve) =>
      this.server.listen(0, '127.0.0.1', resolve),
    );
    this.serverPort = (this.server.address() as AddressInfo).port;
    return this;
  }

  get port(): number {
    return this.serverPort;
  }

  get url(): string {
    return `http://127.0.0.1:${this.serverPort}`;
  }

  async waitForRequests(count: number, timeoutMs = 5000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (this.requests.length >= count) {
        return;
      }
      await sleep(25);
    }
    throw new Error(
      `Timed out waiting for ${count} request(s), got ${this.requests.length}`,
    );
  }

  clear(): void {
    this.requests.length = 0;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve, reject) =>
      this.server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

export async function createCaptureServer(): Promise<CaptureServer> {
  return await new CaptureServer().start();
}
