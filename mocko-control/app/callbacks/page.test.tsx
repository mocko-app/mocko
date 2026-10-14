import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import CallbacksPage from "./page";
import CallbackDetailPage from "./[slug]/page";
import NewCallbackPage from "./new/page";
import { aCallback, aMock, aPendingCallback } from "@/test/fixtures";
import { givenApi, givenApiError, server } from "@/test/msw";
import { getRoute, givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";

describe("callbacks page loading state", () => {
  it("shows the loading state instead of the empty state while loading", async () => {
    givenApi();
    let resolveCallbacks: () => void = () => {};
    const callbacksResponse = new Promise<Response>((resolve) => {
      resolveCallbacks = () => resolve(HttpResponse.json([]));
    });
    server.use(http.get("/api/callbacks", () => callbacksResponse));

    renderWithProviders(<CallbacksPage />);

    expect(
      await screen.findByRole("status", { name: "Loading callbacks" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("No callbacks yet")).not.toBeInTheDocument();

    resolveCallbacks();
    expect(await screen.findByText("No callbacks yet")).toBeInTheDocument();
  });
});

describe("callbacks page sections", () => {
  it("lists pending callbacks before definitions with countdown and mock link", async () => {
    givenApi({
      mocks: [aMock({ id: "mock-42", name: "Create payment" })],
      callbacks: [
        aCallback({ slug: "payment-approved", name: "Payment approved" }),
      ],
      pendingCallbacks: {
        isSupported: true,
        pending: [
          aPendingCallback({
            slug: "payment-approved",
            dueAt: Date.now() + 90_000,
            triggeredByMockId: "mock-42",
          }),
        ],
      },
    });

    renderWithProviders(<CallbacksPage />);

    const pendingList = await screen.findByRole("list", {
      name: "Pending callbacks",
    });
    const pendingCard = within(pendingList).getByRole("listitem", {
      name: "Pending callback: Payment approved",
    });
    expect(pendingCard).toHaveTextContent(/in 1m \d+s/);

    const mockLink = within(pendingCard).getByRole("link", {
      name: "Create payment",
    });
    expect(mockLink).toHaveAttribute("href", "/mocks/mock-42");

    const definitionsList = screen.getByRole("list", {
      name: "Callback definitions",
    });
    expect(
      within(definitionsList).getByRole("listitem", {
        name: "Callback: Payment approved",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("1 callback · 1 pending")).toBeInTheDocument();
  });

  it("shows the read-only badge for file-defined callbacks", async () => {
    givenApi({
      callbacks: [
        aCallback({ slug: "file-callback", annotations: ["READ_ONLY"] }),
      ],
    });

    renderWithProviders(<CallbacksPage />);

    const card = await screen.findByRole("listitem", {
      name: "Callback: file-callback",
    });
    expect(within(card).getByText("Read Only")).toBeInTheDocument();
  });
});

describe("callbacks page against an older core", () => {
  it("shows the upgrade empty state and hides the add button", async () => {
    givenApi({
      callbacks: [],
      pendingCallbacks: { isSupported: false, pending: [] },
    });

    renderWithProviders(<CallbacksPage />);

    expect(
      await screen.findByText("Your Mocko core doesn't support callbacks"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Add new callback" }),
    ).not.toBeInTheDocument();
  });
});

describe("callbacks page fire flow", () => {
  it("fires a definition with a JSON payload", async () => {
    givenApi({
      callbacks: [aCallback({ slug: "payment-approved" })],
    });

    const firedPayloads: unknown[] = [];
    server.use(
      http.post("/api/callbacks/:slug/fire", async ({ request, params }) => {
        firedPayloads.push({
          slug: params.slug,
          body: await request.json(),
        });
        return HttpResponse.json(aPendingCallback(), { status: 202 });
      }),
    );

    const { user } = renderWithProviders(<CallbacksPage />);
    await user.click(
      await screen.findByRole("button", {
        name: "Actions for payment-approved",
      }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Fire" }));

    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByRole("textbox", { name: "Callback payload" }),
      '{{ "key": "abc" }',
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirm firing payment-approved",
      }),
    );

    expect(await screen.findByText("Callback fired.")).toBeInTheDocument();
    expect(firedPayloads).toEqual([
      { slug: "payment-approved", body: { payload: { key: "abc" } } },
    ]);
  });

  it("rejects an invalid JSON payload without firing", async () => {
    givenApi({ callbacks: [aCallback({ slug: "payment-approved" })] });

    let fired = false;
    server.use(
      http.post("/api/callbacks/:slug/fire", () => {
        fired = true;
        return HttpResponse.json(aPendingCallback(), { status: 202 });
      }),
    );

    const { user } = renderWithProviders(<CallbacksPage />);
    await user.click(
      await screen.findByRole("button", {
        name: "Actions for payment-approved",
      }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Fire" }));

    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByRole("textbox", { name: "Callback payload" }),
      "not json",
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirm firing payment-approved",
      }),
    );

    expect(
      await screen.findByText("Payload must be valid JSON."),
    ).toBeInTheDocument();
    expect(fired).toBe(false);
  });
});

describe("callbacks page pending actions", () => {
  it("fires a pending callback immediately", async () => {
    const state = givenApi({
      callbacks: [aCallback({ slug: "payment-approved" })],
      pendingCallbacks: {
        isSupported: true,
        pending: [
          aPendingCallback({ id: "pending-1", slug: "payment-approved" }),
        ],
      },
    });

    const firedIds: string[] = [];
    server.use(
      http.post("/api/callbacks/pending/:id/fire", ({ params }) => {
        firedIds.push(String(params.id));
        state.pendingCallbacks = { isSupported: true, pending: [] };
        return new HttpResponse(null, { status: 202 });
      }),
    );

    const { user } = renderWithProviders(<CallbacksPage />);
    await user.click(
      await screen.findByRole("button", {
        name: "Actions for pending payment-approved",
      }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Fire now" }));

    expect(await screen.findByText("Callback fired.")).toBeInTheDocument();
    expect(firedIds).toEqual(["pending-1"]);
    await waitFor(() =>
      expect(
        screen.queryByRole("list", { name: "Pending callbacks" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("cancels a pending callback", async () => {
    const state = givenApi({
      callbacks: [aCallback({ slug: "payment-approved" })],
      pendingCallbacks: {
        isSupported: true,
        pending: [
          aPendingCallback({ id: "pending-1", slug: "payment-approved" }),
        ],
      },
    });

    const cancelledIds: string[] = [];
    server.use(
      http.delete("/api/callbacks/pending/:id", ({ params }) => {
        cancelledIds.push(String(params.id));
        state.pendingCallbacks = { isSupported: true, pending: [] };
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<CallbacksPage />);
    await user.click(
      await screen.findByRole("button", {
        name: "Actions for pending payment-approved",
      }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Cancel" }));

    expect(
      await screen.findByText("Pending callback cancelled."),
    ).toBeInTheDocument();
    expect(cancelledIds).toEqual(["pending-1"]);
  });

  it("clears all pending callbacks", async () => {
    const state = givenApi({
      callbacks: [aCallback({ slug: "payment-approved" })],
      pendingCallbacks: {
        isSupported: true,
        pending: [aPendingCallback(), aPendingCallback()],
      },
    });

    let cleared = false;
    server.use(
      http.delete("/api/callbacks/pending", () => {
        cleared = true;
        state.pendingCallbacks = { isSupported: true, pending: [] };
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<CallbacksPage />);
    await user.click(
      await screen.findByRole("button", {
        name: "Clear all pending callbacks",
      }),
    );

    expect(
      await screen.findByText("Pending callbacks cleared."),
    ).toBeInTheDocument();
    expect(cleared).toBe(true);
  });
});

describe("callbacks page delete flow", () => {
  it("asks for confirmation before deleting a callback", async () => {
    const state = givenApi({
      callbacks: [aCallback({ slug: "alpha" }), aCallback({ slug: "beta" })],
    });

    const deletedSlugs: string[] = [];
    server.use(
      http.delete("/api/callbacks/:slug", ({ params }) => {
        const slug = String(params.slug);
        deletedSlugs.push(slug);
        state.callbacks = state.callbacks.filter(
          (callback) => callback.slug !== slug,
        );
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<CallbacksPage />);
    const list = await screen.findByRole("list", {
      name: "Callback definitions",
    });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Actions for alpha" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Delete callback");
    expect(deletedSlugs).toEqual([]);

    await user.click(
      within(dialog).getByRole("button", { name: "Confirm deletion of alpha" }),
    );

    expect(await screen.findByText("Callback deleted.")).toBeInTheDocument();
    expect(deletedSlugs).toEqual(["alpha"]);
    await waitFor(() =>
      expect(
        within(
          screen.getByRole("list", { name: "Callback definitions" }),
        ).getAllByRole("listitem"),
      ).toHaveLength(1),
    );
  });
});

describe("callbacks page failure handling", () => {
  it("shows a callout when callbacks cannot be fetched", async () => {
    givenApi();
    givenApiError("get", "/api/callbacks");
    renderWithProviders(<CallbacksPage />);

    expect(
      await screen.findByText("Could not fetch callbacks"),
    ).toBeInTheDocument();
  });
});

function getListedDefinitionNames(): string[] {
  const list = screen.getByRole("list", { name: "Callback definitions" });
  return within(list)
    .getAllByRole("listitem")
    .map((item) => item.getAttribute("aria-label") ?? "");
}

const searchFixtures = () => [
  aCallback({
    slug: "payment-approved",
    name: "Payment approved",
    method: "POST",
    host: "workflows",
    path: "/payments/approved",
  }),
  aCallback({
    slug: "order-shipped",
    method: "PUT",
    url: "https://shipping.example.com/orders",
    host: undefined,
    path: undefined,
  }),
  aCallback({
    slug: "refund-issued",
    name: "Refund issued",
    method: "DELETE",
    host: "billing",
    path: "/refunds",
  }),
];

describe("callbacks page search", () => {
  it("filters definitions by slug, name, method, host and target", async () => {
    givenApi({ callbacks: searchFixtures() });
    const { user } = renderWithProviders(<CallbacksPage />);

    const searchInput = await screen.findByRole("textbox", {
      name: "Search callbacks",
    });

    const cases: [string, string[]][] = [
      ["order-ship", ["Callback: order-shipped"]],
      ["REFUND", ["Callback: Refund issued"]],
      ["put", ["Callback: order-shipped"]],
      ["@workflows", ["Callback: Payment approved"]],
      ["shipping.example", ["Callback: order-shipped"]],
      ["/refunds", ["Callback: Refund issued"]],
    ];
    for (const [query, expected] of cases) {
      await user.clear(searchInput);
      await user.type(searchInput, query);
      expect(getListedDefinitionNames()).toEqual(expected);
    }
  });

  it("does not match headers or body", async () => {
    givenApi({
      callbacks: [
        aCallback({
          slug: "with-body",
          headers: { "X-Event": "order.paid" },
          body: '{ "event": "order.paid" }',
        }),
        aCallback({ slug: "other" }),
      ],
    });
    const { user } = renderWithProviders(<CallbacksPage />);

    await user.type(
      await screen.findByRole("textbox", { name: "Search callbacks" }),
      "order.paid",
    );

    expect(
      screen.getByText("No callbacks match your search."),
    ).toBeInTheDocument();
  });

  it("leaves pending callbacks untouched and shows filtered counts", async () => {
    givenApi({
      callbacks: searchFixtures(),
      pendingCallbacks: {
        isSupported: true,
        pending: [aPendingCallback({ slug: "payment-approved" })],
      },
    });
    const { user } = renderWithProviders(<CallbacksPage />);

    await user.type(
      await screen.findByRole("textbox", { name: "Search callbacks" }),
      "refund",
    );

    expect(getListedDefinitionNames()).toEqual(["Callback: Refund issued"]);
    expect(
      within(
        screen.getByRole("list", { name: "Pending callbacks" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(1);
    expect(
      screen.getByText("1 of 3 callbacks · 1 pending"),
    ).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(
      screen.getByText("2 more callbacks were filtered out."),
    ).toBeInTheDocument();
  });

  it("shows an empty search state and clears it", async () => {
    givenApi({ callbacks: searchFixtures() });
    const { user } = renderWithProviders(<CallbacksPage />);

    const searchInput = await screen.findByRole("textbox", {
      name: "Search callbacks",
    });
    await user.type(searchInput, "nothing-matches");

    expect(
      screen.getByText("No callbacks match your search."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Callback definitions" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(searchInput).toHaveValue("");
    expect(getListedDefinitionNames()).toHaveLength(3);
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/callbacks",
    );
  });

  it("shows the search box from a single definition on", async () => {
    givenApi({ callbacks: [aCallback({ slug: "only-one" })] });
    renderWithProviders(<CallbacksPage />);

    expect(
      await screen.findByRole("textbox", { name: "Search callbacks" }),
    ).toBeInTheDocument();
  });

  it("hides the search box when there are no definitions", async () => {
    givenApi({
      callbacks: [],
      pendingCallbacks: {
        isSupported: true,
        pending: [aPendingCallback({ slug: "deleted-callback" })],
      },
    });
    renderWithProviders(<CallbacksPage />);

    await screen.findByRole("list", { name: "Pending callbacks" });
    expect(
      screen.queryByRole("textbox", { name: "Search callbacks" }),
    ).not.toBeInTheDocument();
  });

  it("hides the search box for the empty and unsupported states", async () => {
    givenApi({ callbacks: [] });
    const empty = renderWithProviders(<CallbacksPage />);
    await screen.findByText("No callbacks yet");
    expect(
      screen.queryByRole("textbox", { name: "Search callbacks" }),
    ).not.toBeInTheDocument();
    empty.unmount();

    givenApi({
      callbacks: [],
      pendingCallbacks: { isSupported: false, pending: [] },
    });
    renderWithProviders(<CallbacksPage />);
    await screen.findByText("Your Mocko core doesn't support callbacks");
    expect(
      screen.queryByRole("textbox", { name: "Search callbacks" }),
    ).not.toBeInTheDocument();
  });
});

describe("callbacks page search URL", () => {
  it("writes the search to the URL with replace", async () => {
    givenRoute({ pathname: "/callbacks" });
    givenApi({ callbacks: searchFixtures() });
    const { user } = renderWithProviders(<CallbacksPage />);

    await user.type(
      await screen.findByRole("textbox", { name: "Search callbacks" }),
      "refund",
    );

    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/callbacks?q=refund",
    );
    expect(router.push).not.toHaveBeenCalled();
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  it("restores the search from the URL", async () => {
    givenRoute({ pathname: "/callbacks", search: "q=refund" });
    givenApi({ callbacks: searchFixtures() });
    renderWithProviders(<CallbacksPage />);

    expect(
      await screen.findByRole("textbox", { name: "Search callbacks" }),
    ).toHaveValue("refund");
    expect(getListedDefinitionNames()).toEqual(["Callback: Refund issued"]);
  });

  it("drops an empty search param from the URL", async () => {
    givenRoute({ pathname: "/callbacks", search: "q=" });
    givenApi({ callbacks: searchFixtures() });
    renderWithProviders(<CallbacksPage />);

    await screen.findByRole("textbox", { name: "Search callbacks" });
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/callbacks",
    );
  });
});

describe("callbacks page search across callback detail", () => {
  async function renderSearchedList() {
    givenRoute({ pathname: "/callbacks" });
    givenApi({ callbacks: searchFixtures() });
    const list = renderWithProviders(<CallbacksPage />);
    await list.user.type(
      await screen.findByRole("textbox", { name: "Search callbacks" }),
      "refund",
    );
    expect(getListedDefinitionNames()).toEqual(["Callback: Refund issued"]);
    return list;
  }

  function browseTo(href: string, params: Record<string, string>) {
    const url = new URL(href, "http://localhost");
    givenRoute({
      pathname: url.pathname,
      params,
      search: url.search.replace(/^\?/, ""),
    });
  }

  async function expectListKeepsSearch() {
    expect(getRoute().pathname).toBe("/callbacks");
    renderWithProviders(<CallbacksPage />);
    expect(
      await screen.findByRole("textbox", { name: "Search callbacks" }),
    ).toHaveValue("refund");
    expect(getListedDefinitionNames()).toEqual(["Callback: Refund issued"]);
  }

  it("keeps the search after opening a callback and closing it", async () => {
    const list = await renderSearchedList();

    const href = screen
      .getByRole("link", { name: "Open Refund issued" })
      .getAttribute("href")!;
    expect(href).toBe("/callbacks/refund-issued?q=refund");
    list.unmount();
    browseTo(href, { slug: "refund-issued" });

    const detail = renderWithProviders(<CallbackDetailPage />);
    await screen.findByRole("form", { name: "Edit callback" });
    await detail.user.click(
      screen.getByRole("button", { name: "Close and return to callbacks" }),
    );
    expect(router.push).toHaveBeenLastCalledWith("/callbacks?q=refund");
    detail.unmount();

    await expectListKeepsSearch();
  });

  it("keeps the search after saving from the actions menu edit", async () => {
    server.use(
      http.patch("/api/callbacks/:slug", () => HttpResponse.json(aCallback())),
    );
    const list = await renderSearchedList();

    await list.user.click(
      screen.getByRole("button", { name: "Actions for Refund issued" }),
    );
    await list.user.click(
      await screen.findByRole("menuitem", { name: "Edit" }),
    );
    expect(router.push).toHaveBeenLastCalledWith(
      "/callbacks/refund-issued?q=refund",
    );
    list.unmount();
    givenRoute({ ...getRoute(), params: { slug: "refund-issued" } });

    const detail = renderWithProviders(<CallbackDetailPage />);
    await screen.findByRole("form", { name: "Edit callback" });
    await detail.user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Callback updated.")).toBeInTheDocument();
    expect(router.push).toHaveBeenLastCalledWith("/callbacks?q=refund");
    detail.unmount();

    await expectListKeepsSearch();
  });

  it("carries the search into add callback and back on cancel", async () => {
    const list = await renderSearchedList();

    const href = screen
      .getByRole("button", { name: "Add new callback" })
      .getAttribute("href")!;
    expect(href).toBe("/callbacks/new?q=refund");
    list.unmount();
    browseTo(href, {});

    const form = renderWithProviders(<NewCallbackPage />);
    await screen.findByRole("form", { name: "Add callback" });
    await form.user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(router.push).toHaveBeenLastCalledWith("/callbacks?q=refund");
    form.unmount();

    await expectListKeepsSearch();
  });
});
