let currentPort = 6651;

export function nextPort(): number {
  return currentPort++;
}
