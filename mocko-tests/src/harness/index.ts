import { MockoInstance, InstanceOptions } from './instance';
export * from './redis';

export { MockoInstance };

export const CONTENT_PORT = 6650;

export async function createSubject(
  options: InstanceOptions = {},
  env: NodeJS.ProcessEnv = {},
): Promise<MockoInstance> {
  const instance = new MockoInstance({ '--watch': true, ...options }, env);
  await instance.init();
  return instance;
}

export async function createContent(
  env: NodeJS.ProcessEnv = {},
): Promise<MockoInstance> {
  const instance = new MockoInstance(
    {
      '--watch': true,
      '--port': CONTENT_PORT,
    },
    env,
  );
  await instance.init();
  return instance;
}

export function randomPath(): string {
  return `/test-${Math.random().toString(36).slice(2, 10)}`;
}
