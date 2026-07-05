import type { MouseEvent } from "react";

// Same-page query updates must use native history, not the router: on
// statically prerendered pages, Next's production router resolves param-only
// navigations against the prerender cache and reverts the URL.
// useSearchParams reflects native history updates.
//
// replaceUrl: for filter/search state that shouldn't add history entries.
// pushUrl: for navigation between param-only views of the same route (flag
// folders, breadcrumbs) that must stay reachable with the back button.
export function replaceUrl(url: string): void {
  window.history.replaceState(null, "", url);
}

export function pushUrl(url: string): void {
  window.history.pushState(null, "", url);
}

// Intercepts a left-click on a same-route link so native history drives the
// navigation. Modifier-clicks fall through so the browser can open a new tab.
export function handleSameRouteClick(
  event: MouseEvent<HTMLAnchorElement>,
  url: string,
): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  pushUrl(url);
}
