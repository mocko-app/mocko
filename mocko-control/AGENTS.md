<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# UI tests

Frontend tests run with Vitest + React Testing Library + jsdom. Run them with `npm test` (or `npm run test:watch`) in this package; the root `npm run test`/`test:full`/`test:full:fast` scripts run them too.

What belongs in this suite:

- Component tests for UI logic that can regress: filter/search interactions, stateful flows (dialogs, "don't ask again"), error rendering (callouts, toasts). Test through user-visible behavior (roles, labels, text), not implementation details.
- Plain unit tests for `lib/` functions, but only when the function is complex and its behavior isn't already covered through the component tests.

What does not belong here:

- API contract tests — `mocko-tests/src/tests/control/` black-box tests the API routes against a real instance.
- Visual/layout assertions and Monaco editor behavior, out of scope for jsdom.

Conventions:

- Test files are colocated: `app/mocks/page.test.tsx` next to `app/mocks/page.tsx`.
- Same-page query-param updates (filters, search) must use `window.history.replaceState(null, "", url)`, never `router.replace`: on statically prerendered pages Next's production router resolves param-only navigations against the prerender cache and reverts the URL (works in `next dev`, breaks in `next start` — jsdom tests cannot catch this since `next/navigation` is mocked). The harness syncs native history calls into the route store (`installHistorySync` in `test/setup.ts`), so `useSearchParams` re-renders in tests; assert URL writes with `expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", url)`.
- The backend is mocked at the HTTP layer with MSW, never mock `lib/frontend/api` or SWR hooks. Handlers and fixtures are typed against the real DTOs in `lib/types/*`, so contract drift fails the type check. Use the helpers in `test/`: `renderWithProviders` (fresh SWR cache + Toaster), `givenApi`/`givenApiError` (MSW handlers for all GET resources; mutable state), fixtures (`aMock`, `aMockDetails`, `aHost`, `aFlagKey`, `aStaleFlagsOperation`, `aMatchingFlagsOperation`), and `givenRoute`/`router` from `test/navigation` (route params/search per test, router spies for asserting redirects). `router.push`/`replace` update the mocked route state, so URL-as-state pages re-render like in the browser.
- MSW rejects unhandled requests (`onUnhandledRequest: "error"`); register handlers for every endpoint the component touches. Mutation handlers (POST/PATCH/PUT/DELETE) are registered per test with `server.use` to capture payloads.
- Monaco is stubbed as a textarea named "Code editor" (`test/monaco-stub.tsx`).
- Number inputs with `min`/`max` block form submission natively (in jsdom too); for out-of-range values assert that no request was sent instead of expecting the app's inline error text.
