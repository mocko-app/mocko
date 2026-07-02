import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { HostDto } from "@/lib/types/host-dtos";
import type { MockDto } from "@/lib/types/mock-dtos";

export const server = setupServer();

export type ApiState = {
  mocks: MockDto[];
  hosts: HostDto[];
};

export function givenApi(initial: Partial<ApiState> = {}): ApiState {
  const state: ApiState = {
    mocks: initial.mocks ?? [],
    hosts: initial.hosts ?? [],
  };

  server.use(
    http.get("/api/mocks", () => HttpResponse.json(state.mocks)),
    http.get("/api/hosts", () => HttpResponse.json(state.hosts)),
  );

  return state;
}

export function givenApiError(
  method: "get" | "post" | "patch" | "delete",
  path: string,
  status = 500,
): void {
  server.use(
    http[method](path, () =>
      HttpResponse.json({ message: "Simulated failure" }, { status }),
    ),
  );
}
