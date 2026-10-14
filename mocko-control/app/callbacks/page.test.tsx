import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import CallbacksPage from "./page";
import CallbackDetailPage from "./[id]/page";
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
        canHold: true,
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

  it("matches pending callbacks to their definition regardless of slug case", async () => {
    givenApi({
      callbacks: [
        aCallback({ slug: "payment-approved", name: "Payment approved" }),
      ],
      pendingCallbacks: {
        isSupported: true,
        canHold: true,
        pending: [aPendingCallback({ slug: "Payment-Approved" })],
      },
    });

    renderWithProviders(<CallbacksPage />);

    const pendingList = await screen.findByRole("list", {
      name: "Pending callbacks",
    });
    expect(
      within(pendingList).getByRole("listitem", {
        name: "Pending callback: Payment approved",
      }),
    ).toBeInTheDocument();
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

describe("callbacks page slug overlaps", () => {
  it("lists every callback sharing a slug with per-id links and badges", async () => {
    givenApi({
      callbacks: [
        aCallback({ id: "cb-ui", slug: "payment-approved", name: "UI" }),
        aCallback({
          id: "cb-file",
          slug: "Payment-Approved",
          name: "File",
          filePath: "callbacks.hcl",
          annotations: ["READ_ONLY", "SHADOWED"],
        }),
      ],
    });

    renderWithProviders(<CallbacksPage />);

    const uiCard = await screen.findByRole("listitem", {
      name: "Callback: UI",
    });
    expect(
      within(uiCard).getByRole("link", { name: "Open UI" }),
    ).toHaveAttribute("href", "/callbacks/cb-ui");
    expect(within(uiCard).queryByText("Shadowed")).not.toBeInTheDocument();

    const fileCard = screen.getByRole("listitem", { name: "Callback: File" });
    expect(
      within(fileCard).getByRole("link", { name: "Open File" }),
    ).toHaveAttribute("href", "/callbacks/cb-file");
    expect(within(fileCard).getByText("Shadowed")).toBeInTheDocument();
    expect(within(fileCard).getByText("callbacks.hcl")).toBeInTheDocument();
  });

  it("hides Fire for a file callback shadowed by a UI callback", async () => {
    givenApi({
      callbacks: [
        aCallback({ slug: "payment-approved", name: "UI" }),
        aCallback({
          slug: "payment-approved",
          name: "File",
          annotations: ["READ_ONLY", "SHADOWED"],
        }),
      ],
    });

    const { user } = renderWithProviders(<CallbacksPage />);

    await user.click(
      await screen.findByRole("button", { name: "Actions for File" }),
    );
    expect(
      await screen.findByRole("menuitem", { name: "View" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Fire" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Actions for UI" }));
    expect(
      await screen.findByRole("menuitem", { name: "Fire" }),
    ).toBeInTheDocument();
  });

  it("keeps Fire for file callbacks that only conflict with each other", async () => {
    givenApi({
      callbacks: [
        aCallback({
          slug: "payment-approved",
          name: "First",
          annotations: ["READ_ONLY", "CONFLICT"],
        }),
        aCallback({
          slug: "payment-approved",
          name: "Second",
          annotations: ["READ_ONLY", "CONFLICT"],
        }),
      ],
    });

    const { user } = renderWithProviders(<CallbacksPage />);

    const card = await screen.findByRole("listitem", {
      name: "Callback: First",
    });
    expect(within(card).getByText("Conflict")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Actions for First" }));
    expect(
      await screen.findByRole("menuitem", { name: "Fire" }),
    ).toBeInTheDocument();
  });

  it("names a pending callback after the UI definition when a file one shares the slug", async () => {
    givenApi({
      callbacks: [
        aCallback({
          slug: "payment-approved",
          name: "From file",
          annotations: ["READ_ONLY", "SHADOWED"],
        }),
        aCallback({ slug: "Payment-Approved", name: "From UI" }),
      ],
      pendingCallbacks: {
        isSupported: true,
        canHold: true,
        pending: [aPendingCallback({ slug: "payment-approved" })],
      },
    });

    renderWithProviders(<CallbacksPage />);

    const pendingList = await screen.findByRole("list", {
      name: "Pending callbacks",
    });
    expect(
      within(pendingList).getByRole("listitem", {
        name: "Pending callback: From UI",
      }),
    ).toBeInTheDocument();
  });
});

describe("callbacks page override action", () => {
  it("opens the new callback form prefilled from a read-only callback", async () => {
    givenRoute({ pathname: "/callbacks", search: "q=payment" });
    givenApi({
      callbacks: [
        aCallback({
          id: "cb-file",
          slug: "payment-approved",
          annotations: ["READ_ONLY"],
        }),
      ],
    });
    const { user } = renderWithProviders(<CallbacksPage />);

    await user.click(
      await screen.findByRole("button", {
        name: "Actions for payment-approved",
      }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Override" }));

    expect(router.push).toHaveBeenCalledWith(
      "/callbacks/new?q=payment&from=cb-file",
    );
  });

  it("offers no override for ui callbacks or file callbacks already overridden", async () => {
    givenApi({
      callbacks: [
        aCallback({ slug: "payment-approved", name: "UI" }),
        aCallback({
          slug: "Payment-Approved",
          name: "File",
          annotations: ["READ_ONLY", "SHADOWED"],
        }),
      ],
    });
    const { user } = renderWithProviders(<CallbacksPage />);

    await user.click(
      await screen.findByRole("button", { name: "Actions for UI" }),
    );
    expect(
      await screen.findByRole("menuitem", { name: "Edit" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Override" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Actions for File" }));
    expect(
      await screen.findByRole("menuitem", { name: "View" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Override" }),
    ).not.toBeInTheDocument();
  });
});

describe("callbacks page against an older core", () => {
  it("shows the upgrade empty state and hides the add button", async () => {
    givenApi({
      callbacks: [],
      pendingCallbacks: { isSupported: false, canHold: false, pending: [] },
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
      callbacks: [aCallback({ id: "cb-payment", slug: "payment-approved" })],
    });

    const firedPayloads: unknown[] = [];
    server.use(
      http.post("/api/callbacks/:id/fire", async ({ request, params }) => {
        firedPayloads.push({
          id: params.id,
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
      { id: "cb-payment", body: { payload: { key: "abc" } } },
    ]);
  });

  it("rejects an invalid JSON payload without firing", async () => {
    givenApi({ callbacks: [aCallback({ slug: "payment-approved" })] });

    let fired = false;
    server.use(
      http.post("/api/callbacks/:id/fire", () => {
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
        canHold: true,
        pending: [
          aPendingCallback({ id: "pending-1", slug: "payment-approved" }),
        ],
      },
    });

    const firedIds: string[] = [];
    server.use(
      http.post("/api/callbacks/pending/:id/fire", ({ params }) => {
        firedIds.push(String(params.id));
        state.pendingCallbacks = {
          isSupported: true,
          canHold: true,
          pending: [],
        };
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
        canHold: true,
        pending: [
          aPendingCallback({ id: "pending-1", slug: "payment-approved" }),
        ],
      },
    });

    const cancelledIds: string[] = [];
    server.use(
      http.delete("/api/callbacks/pending/:id", ({ params }) => {
        cancelledIds.push(String(params.id));
        state.pendingCallbacks = {
          isSupported: true,
          canHold: true,
          pending: [],
        };
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
        canHold: true,
        pending: [aPendingCallback(), aPendingCallback()],
      },
    });

    let cleared = false;
    server.use(
      http.delete("/api/callbacks/pending", () => {
        cleared = true;
        state.pendingCallbacks = {
          isSupported: true,
          canHold: true,
          pending: [],
        };
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

describe("callbacks page held callbacks", () => {
  it("holds a scheduled pending callback and refreshes the list", async () => {
    const scheduled = aPendingCallback({
      id: "pending-1",
      slug: "payment-approved",
    });
    const state = givenApi({
      callbacks: [aCallback({ slug: "payment-approved" })],
      pendingCallbacks: {
        isSupported: true,
        canHold: true,
        pending: [scheduled],
      },
    });

    const heldIds: string[] = [];
    server.use(
      http.post("/api/callbacks/pending/:id/hold", ({ params }) => {
        heldIds.push(String(params.id));
        const held = { ...scheduled, heldAt: Date.now() };
        state.pendingCallbacks = {
          isSupported: true,
          canHold: true,
          pending: [held],
        };
        return HttpResponse.json(held);
      }),
    );

    const { user } = renderWithProviders(<CallbacksPage />);
    await user.click(
      await screen.findByRole("button", {
        name: "Actions for pending payment-approved",
      }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Hold" }));

    expect(await screen.findByText("Callback held.")).toBeInTheDocument();
    expect(heldIds).toEqual(["pending-1"]);
    const card = await screen.findByRole("listitem", {
      name: "Pending callback: payment-approved",
    });
    await waitFor(() => expect(card).toHaveTextContent("Held"));
  });

  it("shows a held callback with its badge and hold time instead of a countdown", async () => {
    givenApi({
      callbacks: [aCallback({ slug: "payment-approved" })],
      pendingCallbacks: {
        isSupported: true,
        canHold: true,
        pending: [
          aPendingCallback({
            slug: "payment-approved",
            dueAt: Date.now() + 90_000,
            heldAt: Date.now() - 3 * 60_000,
          }),
        ],
      },
    });

    const { user } = renderWithProviders(<CallbacksPage />);
    const card = await screen.findByRole("listitem", {
      name: "Pending callback: payment-approved",
    });
    expect(within(card).getByText("Held")).toBeInTheDocument();
    expect(card).toHaveTextContent("held 3m ago");
    expect(card).not.toHaveTextContent(/in 1m \d+s/);

    await user.click(
      within(card).getByRole("button", {
        name: "Actions for pending payment-approved",
      }),
    );
    expect(
      await screen.findByRole("menuitem", { name: "Fire now" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Cancel" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Hold" }),
    ).not.toBeInTheDocument();
  });

  it("hides Hold when the core doesn't support it", async () => {
    givenApi({
      callbacks: [aCallback({ slug: "payment-approved" })],
      pendingCallbacks: {
        isSupported: true,
        canHold: false,
        pending: [aPendingCallback({ slug: "payment-approved" })],
      },
    });

    const { user } = renderWithProviders(<CallbacksPage />);
    await user.click(
      await screen.findByRole("button", {
        name: "Actions for pending payment-approved",
      }),
    );

    expect(
      await screen.findByRole("menuitem", { name: "Fire now" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Hold" }),
    ).not.toBeInTheDocument();
  });

  it("counts held callbacks as pending in the header", async () => {
    givenApi({
      callbacks: [aCallback({ slug: "payment-approved" })],
      pendingCallbacks: {
        isSupported: true,
        canHold: true,
        pending: [
          aPendingCallback({ slug: "payment-approved", heldAt: Date.now() }),
          aPendingCallback({ slug: "payment-approved" }),
        ],
      },
    });

    renderWithProviders(<CallbacksPage />);

    expect(
      await screen.findByText("1 callback · 2 pending"),
    ).toBeInTheDocument();
  });

  it("shows the core's message when Fire now is refused", async () => {
    givenApi({
      callbacks: [aCallback({ slug: "payment-approved" })],
      pendingCallbacks: {
        isSupported: true,
        canHold: true,
        pending: [
          aPendingCallback({
            id: "pending-1",
            slug: "payment-approved",
            heldAt: Date.now(),
          }),
        ],
      },
    });

    server.use(
      http.post("/api/callbacks/pending/:id/fire", () =>
        HttpResponse.json(
          {
            statusCode: 422,
            error: "Unprocessable Entity",
            message: "No callback found with slug 'payment-approved'",
          },
          { status: 422 },
        ),
      ),
    );

    const { user } = renderWithProviders(<CallbacksPage />);
    await user.click(
      await screen.findByRole("button", {
        name: "Actions for pending payment-approved",
      }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Fire now" }));

    expect(
      await screen.findByText("No callback found with slug 'payment-approved'"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", {
        name: "Pending callback: payment-approved",
      }),
    ).toBeInTheDocument();
  });
});

describe("callbacks page delete flow", () => {
  it("asks for confirmation before deleting a callback", async () => {
    const state = givenApi({
      callbacks: [
        aCallback({ id: "cb-alpha", slug: "alpha" }),
        aCallback({ id: "cb-beta", slug: "beta" }),
      ],
    });

    const deletedIds: string[] = [];
    server.use(
      http.delete("/api/callbacks/:id", ({ params }) => {
        const id = String(params.id);
        deletedIds.push(id);
        state.callbacks = state.callbacks.filter(
          (callback) => callback.id !== id,
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
    expect(deletedIds).toEqual([]);

    await user.click(
      within(dialog).getByRole("button", { name: "Confirm deletion of alpha" }),
    );

    expect(await screen.findByText("Callback deleted.")).toBeInTheDocument();
    expect(deletedIds).toEqual(["cb-alpha"]);
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
    id: "cb-refund",
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
        canHold: true,
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
        canHold: true,
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
      pendingCallbacks: { isSupported: false, canHold: false, pending: [] },
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
    expect(href).toBe("/callbacks/cb-refund?q=refund");
    list.unmount();
    browseTo(href, { id: "cb-refund" });

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
      http.patch("/api/callbacks/:id", () => HttpResponse.json(aCallback())),
    );
    const list = await renderSearchedList();

    await list.user.click(
      screen.getByRole("button", { name: "Actions for Refund issued" }),
    );
    await list.user.click(
      await screen.findByRole("menuitem", { name: "Edit" }),
    );
    expect(router.push).toHaveBeenLastCalledWith(
      "/callbacks/cb-refund?q=refund",
    );
    list.unmount();
    givenRoute({ ...getRoute(), params: { id: "cb-refund" } });

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

describe("callbacks page delete confirmation copy", () => {
  async function openDeleteDialog(slug: string) {
    const { user } = renderWithProviders(<CallbacksPage />);
    await user.click(
      await screen.findByRole("button", { name: `Actions for ${slug}` }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    return await screen.findByRole("dialog");
  }

  it("says the file callback takes over when deleting its ui override", async () => {
    givenApi({
      callbacks: [
        aCallback({ id: "cb-ui", slug: "Payment-Approved", annotations: [] }),
        aCallback({
          id: "cb-file",
          slug: "payment-approved",
          annotations: ["READ_ONLY", "SHADOWED"],
        }),
      ],
    });

    const dialog = await openDeleteDialog("Payment-Approved");

    expect(dialog).toHaveTextContent(
      "The file callback with the same slug takes over again.",
    );
    expect(dialog).not.toHaveTextContent("will fail");
  });

  it("keeps the failure warning while another ui callback shares the slug", async () => {
    givenApi({
      callbacks: [
        aCallback({
          id: "cb-ui-1",
          slug: "payment-approved",
          annotations: ["CONFLICT"],
        }),
        aCallback({
          id: "cb-ui-2",
          slug: "Payment-Approved",
          annotations: ["CONFLICT"],
        }),
        aCallback({
          id: "cb-file",
          slug: "payment-approved",
          annotations: ["READ_ONLY", "CONFLICT"],
        }),
      ],
    });

    const dialog = await openDeleteDialog("Payment-Approved");

    expect(dialog).toHaveTextContent(
      "Mocks triggering this callback will fail until it is recreated.",
    );
  });
});
