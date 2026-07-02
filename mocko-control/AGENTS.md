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
- The backend is mocked at the HTTP layer with MSW, never mock `lib/frontend/api` or SWR hooks. Handlers and fixtures are typed against the real DTOs in `lib/types/*`, so contract drift fails the type check. Use the helpers in `test/`: `renderWithProviders` (fresh SWR cache + Toaster), `givenApi`/`givenApiError` (MSW handlers), `aMock` (fixtures).
- MSW rejects unhandled requests (`onUnhandledRequest: "error"`); register handlers for every endpoint the component touches.
