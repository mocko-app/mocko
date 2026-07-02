// Same-page query updates must use native history, not router.replace: on
// statically prerendered pages, Next's production router resolves param-only
// navigations against the prerender cache and reverts the URL.
// useSearchParams reflects native history updates.
export function replaceUrl(url: string): void {
  window.history.replaceState(null, "", url);
}
