import { MockoInstance, InstanceOptions } from './instance';

export { MockoInstance };

export const CONTENT_PORT = 6650;

export async function createSubject(
  options: InstanceOptions = {},
): Promise<MockoInstance> {
  const instance = new MockoInstance({ '--watch': true, ...options });
  await instance.init();
  return instance;
}

export async function createContent(): Promise<MockoInstance> {
  const instance = new MockoInstance({
    '--watch': true,
    '--port': CONTENT_PORT,
  });
  await instance.init();
  return instance;
}

export function randomPath(): string {
  return `/test-${Math.random().toString(36).slice(2, 10)}`;
}
