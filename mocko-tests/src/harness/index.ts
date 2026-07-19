import { MockoInstance, InstanceOptions } from './instance';
export * from './redis';
export * from './flags';
export * from './capture';

export { MockoInstance };

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
  const instance = new MockoInstance({ '--watch': true }, env);
  await instance.init();
  return instance;
}

export function randomPath(): string {
  return `/test-${Math.random().toString(36).slice(2, 10)}`;
}
