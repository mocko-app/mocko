type CoreMockSource = "FILE" | "DEPLOYED";
type CoreFlagType = "PREFIX" | "FLAG";

export type CoreDeployMockDefinition = {
  id?: string;
  method: string;
  path: string;
  parse: boolean;
  host?: string;
  labels: string[];
  response: {
    code: number;
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
  isEnabled: boolean;
  source: CoreMockSource;
  labels: string[];
};

export type CoreMockDetailsDto = CoreMockDto & {
  response: {
    code: number;
    body?: string;
    headers: Record<string, string>;
  };
  failure: {
    message: string;
    date: string;
  } | null;
};

export type CoreDeployDefinition = {
  mocks: CoreDeployMockDefinition[];
  hosts: CoreDeployHostDefinition[];
  data?: undefined;
};

export type CoreHostDto = {
  slug: string;
  name?: string;
  source: string;
  destination?: string;
};

export type CoreFlagKeyDto = {
  type: CoreFlagType;
  name: string;
};

export type CoreFlagListDto = {
  flagKeys: CoreFlagKeyDto[];
  isTruncated: boolean;
};

export type CoreFlagDto = {
  value: string;
};

export type CorePutFlagDto = {
  value: string;
};
