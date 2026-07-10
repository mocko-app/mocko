import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { VersionsDto } from "@/app/api/versions/route";
import type { FlagDto, FlagListDto } from "@/lib/types/flag-dtos";
import type { HostDto } from "@/lib/types/host-dtos";
import type { MockDetailsDto, MockDto } from "@/lib/types/mock-dtos";
import type { OperationsResponse } from "@/lib/types/operation";

export const server = setupServer();

export type ApiState = {
  mocks: MockDto[];
  mockDetails: MockDetailsDto[];
  hosts: HostDto[];
  flagList: FlagListDto;
  flagValues: Record<string, FlagDto>;
  operations: OperationsResponse;
  versions: VersionsDto;
};

export function givenApi(initial: Partial<ApiState> = {}): ApiState {
  const state: ApiState = {
    mocks: initial.mocks ?? [],
    mockDetails: initial.mockDetails ?? [],
    hosts: initial.hosts ?? [],
    flagList: initial.flagList ?? { flagKeys: [], isTruncated: false },
    flagValues: initial.flagValues ?? {},
    operations: initial.operations ?? {
      operations: [],
      sentinelAgeSeconds: null,
      managementSupported: true,
    },
    versions: initial.versions ?? {
      control: "0.0.0-test",
      core: "0.0.0-test",
      mockBaseUrl: "http://localhost:8080",
    },
  };

  server.use(
    http.get("/api/mocks", () => HttpResponse.json(state.mocks)),
    http.get("/api/mocks/:id", ({ params }) => {
      const mock = state.mockDetails.find((m) => m.id === params.id);
      if (!mock) {
        return HttpResponse.json(
          {
            code: "MOCK_NOT_FOUND",
            message: `Mock "${params.id}" was not found`,
          },
          { status: 404 },
        );
      }
      return HttpResponse.json(mock);
    }),
    http.get("/api/hosts", () => HttpResponse.json(state.hosts)),
    http.get("/api/hosts/:slug", ({ params }) => {
      const host = state.hosts.find((h) => h.slug === params.slug);
      if (!host) {
        return HttpResponse.json(
          {
            code: "HOST_NOT_FOUND",
            message: `Host "${params.slug}" was not found`,
          },
          { status: 404 },
        );
      }
      return HttpResponse.json(host);
    }),
    http.get("/api/flags", () => HttpResponse.json(state.flagList)),
    http.get("/api/flags/:key", ({ params }) => {
      const key = decodeURIComponent(String(params.key));
      const flag = state.flagValues[key];
      if (!flag) {
        return HttpResponse.json(
          { code: "FLAG_NOT_FOUND", message: `Flag "${key}" was not found` },
          { status: 404 },
        );
      }
      return HttpResponse.json(flag);
    }),
    http.get("/api/operations", () => HttpResponse.json(state.operations)),
    http.get("/api/versions", () => HttpResponse.json(state.versions)),
  );

  return state;
}

export function givenApiError(
  method: "get" | "post" | "put" | "patch" | "delete",
  path: string,
  status = 500,
): void {
  server.use(
    http[method](path, () =>
      HttpResponse.json({ message: "Simulated failure" }, { status }),
    ),
  );
}
