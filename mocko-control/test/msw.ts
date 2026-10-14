import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { VersionsDto } from "@/app/api/versions/route";
import type {
  CallbackDetailsDto,
  CallbackDto,
  PendingCallbacksDto,
} from "@/lib/types/callback-dtos";
import type { FlagDto, FlagListDto } from "@/lib/types/flag-dtos";
import type { HostDetailsDto, HostDto } from "@/lib/types/host-dtos";
import type { MockDetailsDto, MockDto } from "@/lib/types/mock-dtos";
import type { OperationsResponse } from "@/lib/types/operation";

export const server = setupServer();

export type ApiState = {
  mocks: MockDto[];
  mockDetails: MockDetailsDto[];
  hosts: HostDto[];
  hostDetails: HostDetailsDto[];
  callbacks: CallbackDto[];
  callbackDetails: CallbackDetailsDto[];
  pendingCallbacks: PendingCallbacksDto;
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
    hostDetails: initial.hostDetails ?? [],
    callbacks: initial.callbacks ?? [],
    callbackDetails: initial.callbackDetails ?? [],
    pendingCallbacks: initial.pendingCallbacks ?? {
      isSupported: true,
      pending: [],
    },
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
    http.get("/api/hosts/:id", ({ params }) => {
      const details = state.hostDetails.find((h) => h.id === params.id);
      if (details) {
        return HttpResponse.json(details);
      }
      const host = state.hosts.find((h) => h.id === params.id);
      if (!host) {
        return HttpResponse.json(
          {
            code: "HOST_NOT_FOUND",
            message: `Host "${params.id}" was not found`,
          },
          { status: 404 },
        );
      }
      return HttpResponse.json({ ...host, conflict: null });
    }),
    http.get("/api/callbacks", () => HttpResponse.json(state.callbacks)),
    http.get("/api/callbacks/pending", () =>
      HttpResponse.json(state.pendingCallbacks),
    ),
    http.get("/api/callbacks/:id", ({ params }) => {
      const details = state.callbackDetails.find((c) => c.id === params.id);
      if (details) {
        return HttpResponse.json(details);
      }
      const callback = state.callbacks.find((c) => c.id === params.id);
      if (!callback) {
        return HttpResponse.json(
          {
            code: "CALLBACK_NOT_FOUND",
            message: `Callback "${params.id}" was not found`,
          },
          { status: 404 },
        );
      }
      return HttpResponse.json({ ...callback, conflict: null });
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
