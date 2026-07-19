import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import CallbacksPage from "./page";
import { aCallback, aMock, aPendingCallback } from "@/test/fixtures";
import { givenApi, givenApiError, server } from "@/test/msw";
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
      await screen.findByRole("button", { name: "Fire payment-approved" }),
    );

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
      await screen.findByRole("button", { name: "Fire payment-approved" }),
    );

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
      await screen.findByRole("button", { name: "Fire payment-approved now" }),
    );

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
        name: "Cancel pending payment-approved",
      }),
    );

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
