import { AxiosInstance } from 'axios';

export type HealthResponse = { revision: number };

const POLL_INTERVAL = 50;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForHealth(
  client: AxiosInstance,
  targetRevision = 0,
  timeout = 5000,
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await client.get<HealthResponse>('/__mocko__/health');
      if (res.data.revision >= targetRevision) return;
    } catch {}
    await sleep(POLL_INTERVAL);
  }
  throw new Error(
    `Timed out waiting for mocko health (revision ${targetRevision})`,
  );
}

export async function waitForStatus(
  client: AxiosInstance,
  path: string,
  status: number,
  timeout = 5000,
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await client.get(path);
      if (res.status === status) {
        return;
      }
    } catch {}
    await sleep(POLL_INTERVAL);
  }

  throw new Error(`Timed out waiting for ${path} to return ${status}`);
}
