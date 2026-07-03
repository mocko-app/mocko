import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./msw";
import { installHistorySync, resetRoute } from "./navigation";

// jsdom lacks a few browser APIs used by Base UI, sonner and next-themes.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};

// Route state lives in test/navigation.ts; push/replace update it so
// URL-as-state pages (flags prefix/search) re-render like in the browser.
vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  const { getRoute, router, subscribeToRoute } = await import("./navigation");

  function useRoute() {
    return useSyncExternalStore(subscribeToRoute, getRoute, getRoute);
  }

  return {
    useRouter: () => router,
    usePathname: () => useRoute().pathname,
    useParams: () => useRoute().params,
    useSearchParams: () => new URLSearchParams(useRoute().search),
  };
});

// Monaco cannot run in jsdom; the stub renders a plain textarea.
vi.mock("@monaco-editor/react", () => import("./monaco-stub"));

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

beforeEach(() => installHistorySync());

afterEach(() => {
  server.resetHandlers();
  cleanup();
  resetRoute();
});

afterAll(() => server.close());
