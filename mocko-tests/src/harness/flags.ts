import type { AxiosInstance, AxiosResponse } from 'axios';

type ArgValue = boolean | string | number;
type FlagSource = 'MOCK' | 'CONTROL' | 'SDK';
type JsonFlagValue =
  | null
  | boolean
  | string
  | number
  | JsonFlagValue[]
  | { [key: string]: JsonFlagValue };

export function buildArgs(
  options: Record<string, ArgValue | undefined>,
): string[] {
  const args: string[] = [];
  for (const [flag, value] of Object.entries(options)) {
    if (value === false || value == null) continue;
    if (value === true) {
      args.push(flag);
    } else {
      args.push(flag, String(value));
    }
  }
  return args;
}

export function flagPayload(
  value: JsonFlagValue,
  source: FlagSource = 'CONTROL',
): { value: string; source: FlagSource } {
  return { value: JSON.stringify(value), source };
}

export async function setControlFlag(
  control: AxiosInstance,
  key: string,
  value: JsonFlagValue,
): Promise<AxiosResponse> {
  return await control.put(
    `/api/flags/${encodeURIComponent(key)}`,
    flagPayload(value, 'CONTROL'),
  );
}

export async function setCoreFlag(
  core: AxiosInstance,
  key: string,
  value: JsonFlagValue,
  source: FlagSource = 'CONTROL',
): Promise<AxiosResponse> {
  return await core.put(
    `/__mocko__/flags/${encodeURIComponent(key)}`,
    flagPayload(value, source),
  );
}

export function redisFlagFields(
  value: unknown,
  source: FlagSource = 'CONTROL',
): Record<string, string> {
  return {
    value: JSON.stringify(value),
    [updatedAtField(source)]: new Date().toISOString(),
  };
}

function updatedAtField(
  source: FlagSource,
): 'mockUpdatedAt' | 'controlUpdatedAt' | 'sdkUpdatedAt' {
  switch (source) {
    case 'MOCK':
      return 'mockUpdatedAt';
    case 'CONTROL':
      return 'controlUpdatedAt';
    case 'SDK':
      return 'sdkUpdatedAt';
  }
}
