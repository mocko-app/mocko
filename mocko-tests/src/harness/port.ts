let currentPort = 20000 + Math.floor(Math.random() * 20000);

export function nextPort(): number {
  return currentPort++;
}
