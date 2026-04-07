type CoreMockSource = "FILE" | "DEPLOYED";
type CoreFlagType = "PREFIX" | "FLAG";

export type CoreMockDto = {
  id: string;
  name: string;
  method: string;
  path: string;
  filePath?: string;
  isEnabled: boolean;
  source: CoreMockSource;
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
  mocks: Array<{
    id?: string;
    method: string;
    path: string;
    parse: boolean;
    response: {
      code: number;
      body: string;
      headers: Record<string, string>;
    };
  }>;
  hosts: [];
  data?: undefined;
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
