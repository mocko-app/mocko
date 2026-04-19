import type {
  CoreDeployDefinition,
  CoreMockDetailsDto,
  CoreMockDto,
} from "@/lib/core/data/core.dto";
import type { Host } from "@/lib/types/host";
import type { Mock } from "@/lib/types/mock";

export function toDeployDefinition(
  mocks: Mock[],
  hosts: Host[] = [],
): CoreDeployDefinition {
  return {
    mocks: mocks
      .filter((mock) => mock.isEnabled)
      .map((mock) => ({
        id: mock.id,
        method: mock.method,
        path: mock.path,
        parse: true,
        host: mock.host,
        labels: mock.labels,
        response: {
          code: mock.response.code,
          delay: mock.response.delay,
          body: mock.response.body ?? "",
          headers: { ...mock.response.headers },
        },
      })),
    hosts: hosts.map((host) => ({
      slug: host.slug,
      name: host.name,
      source: host.source,
      destination: host.destination,
    })),
    data: undefined,
  };
}

export function toReadOnlyMock(coreMock: CoreMockDto): Mock {
  return {
    id: coreMock.id,
    name: coreMock.name,
    method: coreMock.method as Mock["method"],
    path: coreMock.path,
    host: coreMock.host,
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
    host: coreMock.host,
    filePath: coreMock.filePath,
    isEnabled: coreMock.isEnabled,
    labels: coreMock.labels ?? [],
    response: {
      code: coreMock.response.code,
      delay: coreMock.response.delay,
      body: coreMock.response.body,
      headers: { ...coreMock.response.headers },
    },
    annotations: ["READ_ONLY"],
  };
}
