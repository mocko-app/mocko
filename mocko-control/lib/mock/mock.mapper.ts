import type {
  CoreDeployDefinition,
  CoreMockDetailsDto,
  CoreMockDto,
} from "@/lib/core/data/core.dto";
import type { Mock } from "@/lib/types/mock";

export function toDeployDefinition(mocks: Mock[]): CoreDeployDefinition {
  return {
    mocks: mocks
      .filter((mock) => mock.isEnabled)
      .map((mock) => ({
        id: mock.id,
        method: mock.method,
        path: mock.path,
        parse: true,
        labels: mock.labels,
        response: {
          code: mock.response.code,
          body: mock.response.body ?? "",
          headers: { ...mock.response.headers },
        },
      })),
    hosts: [],
    data: undefined,
  };
}

export function toReadOnlyMock(coreMock: CoreMockDto): Mock {
  return {
    id: coreMock.id,
    name: coreMock.name,
    method: coreMock.method as Mock["method"],
    path: coreMock.path,
    filePath: coreMock.filePath,
    isEnabled: coreMock.isEnabled,
    labels: coreMock.labels ?? [],
    response: {
      code: 200,
      headers: {},
    },
    annotations: ["READ_ONLY"],
  };
}

export function toReadOnlyDetailsMock(coreMock: CoreMockDetailsDto): Mock {
  return {
    id: coreMock.id,
    name: coreMock.name,
    method: coreMock.method as Mock["method"],
    path: coreMock.path,
    filePath: coreMock.filePath,
    isEnabled: coreMock.isEnabled,
    labels: coreMock.labels ?? [],
    response: {
      code: coreMock.response.code,
      body: coreMock.response.body,
      headers: { ...coreMock.response.headers },
    },
    annotations: ["READ_ONLY"],
  };
}
