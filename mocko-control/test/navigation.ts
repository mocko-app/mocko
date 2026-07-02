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

// Same-page query updates must go through native history.replaceState:
// on statically prerendered pages Next's production router resolves
// param-only navigations against the prerender cache and reverts the URL,
// while useSearchParams does reflect native history updates. This sync
// mirrors that so URL-as-state pages re-render in tests too. Reinstalled
// per test because restoreMocks unwinds vi.spyOn.
export function installHistorySync(): void {
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method].bind(window.history);
    vi.spyOn(window.history, method).mockImplementation(
      (state, unused, url) => {
        original(state, unused, url);
        if (url != null) navigateTo(String(url));
      },
    );
  }
}
