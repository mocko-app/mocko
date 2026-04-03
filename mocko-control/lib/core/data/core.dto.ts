type CoreMockSource = "FILE" | "DEPLOYED";

export type CoreMockDto = {
  id: string;
  name: string;
  method: string;
  path: string;
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
