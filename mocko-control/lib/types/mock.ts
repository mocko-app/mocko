export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export const MOCK_ANNOTATIONS = ["TEMPORARY", "READ_ONLY"] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];
export type MockAnnotation = (typeof MOCK_ANNOTATIONS)[number];

export type MockResponse = {
  code: number;
  body?: string;
  headers: Record<string, string>;
};

export type Mock = {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  host?: string;
  filePath?: string;
  response: MockResponse;
  isEnabled: boolean;
  labels: string[];
  annotations: MockAnnotation[];
};
