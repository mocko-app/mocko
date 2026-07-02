import { vi } from "vitest";

export type RouteState = {
  pathname: string;
  params: Record<string, string>;
  search: string;
};

const DEFAULT_ROUTE: RouteState = {
  pathname: "/mocks",
  params: {},
  search: "",
};

let route: RouteState = DEFAULT_ROUTE;
const listeners = new Set<() => void>();

function setRoute(next: RouteState): void {
  route = next;
  for (const listener of listeners) {
    listener();
  }
}

function navigateTo(href: string): void {
  const url = new URL(href, "http://localhost");
  setRoute({
    ...route,
    pathname: url.pathname,
    search: url.search.replace(/^\?/, ""),
  });
}

export const router = {
  push: vi.fn(navigateTo),
  replace: vi.fn(navigateTo),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export function subscribeToRoute(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRoute(): RouteState {
  return route;
}

export function givenRoute(overrides: Partial<RouteState>): void {
  setRoute({ ...DEFAULT_ROUTE, ...overrides });
}

// Also clears router call history: restoreMocks only covers vi.spyOn spies,
// so these module-level vi.fn()s would otherwise leak calls across tests.
export function resetRoute(): void {
  route = DEFAULT_ROUTE;
  for (const fn of Object.values(router)) {
    fn.mockClear();
  }
}
