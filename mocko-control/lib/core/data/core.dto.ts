type CoreMockSource = "FILE" | "DEPLOYED";
type CoreFlagType = "PREFIX" | "FLAG";
type CoreFlagSource = "MOCK" | "CONTROL" | "SDK";

export type CoreDeployMockDefinition = {
  id?: string;
  method: string;
  path: string;
  parse: boolean;
  format?: string;
  host?: string;
  labels: string[];
  response: {
    code: number;
    delay?: number;
    body: string;
    headers: Record<string, string>;
  };
};

export type CoreDeployHostDefinition = {
  slug: string;
  name?: string;
  source: string;
  destination?: string;
};

export type CoreMockDto = {
  id: string;
  name: string;
  method: string;
  path: string;
  host?: string;
  filePath?: string;
  format?: string;
  isEnabled: boolean;
  source: CoreMockSource;
  labels: string[];
};

export type CoreMockDetailsDto = CoreMockDto & {
  response: {
    code: number;
    delay?: number;
    body?: string;
    headers: Record<string, string>;
  };
  failure: {
    message: string;
    date: string;
  } | null;
};

export type CoreDeployCallbackDefinition = {
  slug: string;
  name?: string;
  method: string;
  host?: string;
  path?: string;
  url?: string;
  delay: number;
  headers: Record<string, string>;
  body?: string;
};

export type CoreDeployDefinition = {
  mocks: CoreDeployMockDefinition[];
  hosts: CoreDeployHostDefinition[];
  callbacks?: CoreDeployCallbackDefinition[];
  data?: undefined;
};

export type CoreHostDto = {
  slug: string;
  name?: string;
  source: string;
  destination?: string;
};

export type CoreCallbackDto = {
  slug: string;
  name?: string;
  method: string;
  host?: string;
  path?: string;
  url?: string;
  delay: number;
  headers: Record<string, string>;
  body?: string;
  filePath?: string;
};

export type CorePendingCallbackDto = {
  id: string;
  slug: string;
  payload: unknown;
  dueAt: number;
  createdAt: number;
  triggeredByMockId?: string;
};

export type CoreFlagKeyDto = {
  type: CoreFlagType;
  name: string;
  count?: number;
  matchCount?: number;
};

export type CoreFlagListDto = {
  flagKeys: CoreFlagKeyDto[];
  isTruncated: boolean;
  count?: number;
  matchCount?: number;
};

export type CoreFlagDto = {
  value: string;
  mockUpdatedAt?: string;
  controlUpdatedAt?: string;
  sdkUpdatedAt?: string;
};

export type CorePutFlagDto = {
  value: string;
  source: CoreFlagSource;
};
