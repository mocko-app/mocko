const WORKER_ID = Number(process.env.JEST_WORKER_ID ?? 1);
const BLOCK_SIZE = 4000;
const BASE_PORT = 20000 + (WORKER_ID - 1) * BLOCK_SIZE;

let offset = 0;

export function nextPort(): number {
  return BASE_PORT + (offset++ % BLOCK_SIZE);
}
