const POLL_INTERVAL = 50;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function eventually<T>(
  assertion: () => Promise<T>,
  timeout = 10000,
): Promise<T> {
  const deadline = Date.now() + timeout;
  for (;;) {
    try {
      return await assertion();
    } catch (error) {
      if (Date.now() >= deadline) {
        throw error;
      }
    }
    await sleep(POLL_INTERVAL);
  }
}
