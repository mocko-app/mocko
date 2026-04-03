import { AxiosInstance } from 'axios';

export type HealthResponse = { revision: number };

const POLL_INTERVAL = 10;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForHealth(
  client: AxiosInstance,
  targetRevision = 0,
  timeout = 5000,
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await client.get<HealthResponse>('/health');
      if (res.data.revision >= targetRevision) return;
    } catch {}
    await sleep(POLL_INTERVAL);
  }
  throw new Error(
    `Timed out waiting for mocko health (revision ${targetRevision})`,
  );
}
