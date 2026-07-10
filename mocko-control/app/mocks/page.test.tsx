import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import MocksPage from "./page";
import EditMockPage from "./[id]/page";
import { aMock, aMockDetails } from "@/test/fixtures";
import { givenApi, givenApiError, server } from "@/test/msw";
import { getRoute, givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";

async function findMocksList() {
  return await screen.findByRole("list", { name: "Mocks list" });
}

function getListedMockNames(): string[] {
  const list = screen.getByRole("list", { name: "Mocks list" });
  return within(list)
    .getAllByRole("listitem")
    .map((item) => item.getAttribute("aria-label") ?? "");
}

function getChipNames(candidates: string[]): string[] {
  return screen
    .getAllByRole("button")
    .map((button) => button.textContent ?? "")
    .filter((name) => candidates.includes(name));
}

async function findEmptyFilterState() {
  return await screen.findByText("No mocks match the current filters.");
}

const fixtures = () => [
  aMock({ name: "Get users", method: "GET", labels: ["users"] }),
  aMock({ name: "Create user", method: "POST", labels: ["users", "admin"] }),
  aMock({ name: "Get payments", method: "GET", labels: ["payments"] }),
  aMock({ name: "Health check", method: "GET", labels: [] }),
];

describe("mocks page filtering", () => {
  it("combines label and search filters and clears both at once", async () => {
    givenApi({ mocks: fixtures() });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    expect(getListedMockNames()).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: "users" }));
    expect(getListedMockNames()).toEqual([
      "Mock: Get users",
      "Mock: Create user",
    ]);
    expect(
      screen.getByText("2 more mocks were filtered out."),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Search mocks" }),
      "create",
    );
    expect(getListedMockNames()).toEqual(["Mock: Create user"]);
    expect(
      screen.getByText("3 more mocks were filtered out."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(getListedMockNames()).toHaveLength(4);
    expect(screen.getByRole("textbox", { name: "Search mocks" })).toHaveValue(
      "",
    );
    expect(
      screen.queryByText(/filtered out/, { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("clears the search with the inline clear button", async () => {
    givenApi({ mocks: fixtures() });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    const searchInput = screen.getByRole("textbox", { name: "Search mocks" });

    expect(
      screen.queryByRole("button", { name: "Clear search field" }),
    ).not.toBeInTheDocument();

    await user.type(searchInput, "create");
    expect(getListedMockNames()).toEqual(["Mock: Create user"]);

    await user.click(
      screen.getByRole("button", { name: "Clear search field" }),
    );
    expect(searchInput).toHaveValue("");
    expect(getListedMockNames()).toHaveLength(4);
    expect(
      screen.queryByRole("button", { name: "Clear search field" }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty filter state when the search matches nothing", async () => {
    givenApi({ mocks: fixtures() });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    await user.type(
      screen.getByRole("textbox", { name: "Search mocks" }),
      "does-not-exist",
    );

    const emptyState = screen.getByRole("status");
    expect(emptyState).toHaveTextContent("No mocks match the current filters.");
    expect(
      screen.queryByRole("list", { name: "Mocks list" }),
    ).not.toBeInTheDocument();

    await user.click(
      within(emptyState).getByRole("button", { name: "Clear filters" }),
    );
    expect(getListedMockNames()).toHaveLength(4);
  });

  it("filters down to unlabeled mocks with the unlabeled chip", async () => {
    givenApi({ mocks: fixtures() });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    await user.click(screen.getByRole("button", { name: "Unlabeled" }));
    expect(getListedMockNames()).toEqual(["Mock: Health check"]);

    await user.click(screen.getByRole("button", { name: "Unlabeled" }));
    expect(getListedMockNames()).toHaveLength(4);
  });

  it("matches search terms against path and labels, not just the name", async () => {
    givenApi({
      mocks: [
        aMock({ name: "Alpha", path: "/billing/invoices" }),
        aMock({ name: "Beta", labels: ["billing"] }),
        aMock({ name: "Gamma" }),
      ],
    });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    await user.type(
      screen.getByRole("textbox", { name: "Search mocks" }),
      "billing",
    );
    expect(getListedMockNames()).toEqual(["Mock: Alpha", "Mock: Beta"]);
  });

  it("narrows label chips to those of matching mocks while searching", async () => {
    givenApi({ mocks: fixtures() });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    await user.type(
      screen.getByRole("textbox", { name: "Search mocks" }),
      "payments",
    );

    expect(
      screen.getByRole("button", { name: "payments" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "users" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "admin" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Unlabeled" }),
    ).not.toBeInTheDocument();
  });

  it("narrows unselected chips to labels co-occurring with the selection", async () => {
    givenApi({ mocks: fixtures() });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    await user.click(screen.getByRole("button", { name: "users" }));

    expect(screen.getByRole("button", { name: "users" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "admin" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "payments" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Unlabeled" }),
    ).not.toBeInTheDocument();
  });

  it("keeps selected label chips visible when filters empty the list", async () => {
    givenApi({
      mocks: [
        aMock({ name: "Foo mock", labels: ["foo"] }),
        aMock({ name: "A bar mock", labels: [] }),
      ],
    });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    await user.click(screen.getByRole("button", { name: "foo" }));
    await user.type(
      screen.getByRole("textbox", { name: "Search mocks" }),
      "bar",
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "No mocks match the current filters.",
    );

    await user.click(screen.getByRole("button", { name: "foo" }));
    expect(getListedMockNames()).toEqual(["Mock: A bar mock"]);
  });

  it("orders chips by match count with selected chips first", async () => {
    givenApi({
      mocks: [
        aMock({ name: "U1", labels: ["users"] }),
        aMock({ name: "U2", labels: ["users", "admin"] }),
        aMock({ name: "U3", labels: ["users", "admin"] }),
        aMock({ name: "Z", labels: ["zeta"] }),
        aMock({ name: "B", labels: ["beta"] }),
        aMock({ name: "P", labels: [] }),
      ],
    });
    const { user } = renderWithProviders(<MocksPage />);
    await findMocksList();

    const chips = ["users", "admin", "zeta", "beta", "Unlabeled"];
    expect(getChipNames(chips)).toEqual([
      "users",
      "admin",
      "beta",
      "zeta",
      "Unlabeled",
    ]);

    await user.click(screen.getByRole("button", { name: "admin" }));
    await user.click(screen.getByRole("button", { name: "users" }));
    expect(getChipNames(chips)).toEqual(["users", "admin"]);
  });

  it("does not offer label filters when no mock has labels", async () => {
    givenApi({
      mocks: [aMock({ name: "First" }), aMock({ name: "Second" })],
    });
    renderWithProviders(<MocksPage />);

    await findMocksList();
    expect(
      screen.queryByRole("button", { name: "Unlabeled" }),
    ).not.toBeInTheDocument();
  });
});

describe("mocks page URL filters", () => {
  it("applies filters from the URL and rewrites it when deselecting a chip", async () => {
    givenRoute({ pathname: "/mocks", search: "q=bar&label=foo" });
    givenApi({
      mocks: [
        aMock({ name: "Foo bar", labels: ["foo"] }),
        aMock({ name: "Foo only", labels: ["foo"] }),
        aMock({ name: "bar plain", labels: [] }),
      ],
    });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    expect(getListedMockNames()).toEqual(["Mock: Foo bar"]);
    expect(screen.getByRole("textbox", { name: "Search mocks" })).toHaveValue(
      "bar",
    );
    expect(screen.getByRole("button", { name: "foo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "foo" }));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/mocks?q=bar",
    );
    expect(getListedMockNames()).toEqual(["Mock: Foo bar", "Mock: bar plain"]);
    expect(router.push).not.toHaveBeenCalled();
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  it("shows no mocks for an unlabeled+label URL but keeps both chips deselectable", async () => {
    givenRoute({ pathname: "/mocks", search: "label=foo&label=__unlabeled__" });
    givenApi({
      mocks: [
        aMock({ name: "Foo mock", labels: ["foo"] }),
        aMock({ name: "Plain mock", labels: [] }),
      ],
    });
    const { user } = renderWithProviders(<MocksPage />);

    await findEmptyFilterState();
    expect(screen.getByRole("button", { name: "foo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Unlabeled" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "foo" }));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/mocks?label=__unlabeled__",
    );
    expect(getListedMockNames()).toEqual(["Mock: Plain mock"]);
  });

  it("keeps a URL label that matches no mock as a deselectable chip", async () => {
    givenRoute({ pathname: "/mocks", search: "label=ghost" });
    givenApi({ mocks: [aMock({ name: "Real mock", labels: ["foo"] })] });
    const { user } = renderWithProviders(<MocksPage />);

    await findEmptyFilterState();
    await user.click(screen.getByRole("button", { name: "ghost" }));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/mocks",
    );
    expect(getListedMockNames()).toEqual(["Mock: Real mock"]);
  });

  it("matches URL labels case-insensitively without rewriting the URL", async () => {
    givenRoute({ pathname: "/mocks", search: "label=FOO" });
    givenApi({
      mocks: [
        aMock({ name: "Foo mock", labels: ["Foo"] }),
        aMock({ name: "Other mock", labels: ["other"] }),
      ],
    });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    expect(getListedMockNames()).toEqual(["Mock: Foo mock"]);
    expect(window.history.replaceState).not.toHaveBeenCalled();

    const chip = screen.getByRole("button", { name: "Foo" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await user.click(chip);
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/mocks",
    );
    expect(getListedMockNames()).toHaveLength(2);
  });

  it("canonicalizes duplicate URL labels on load", async () => {
    givenRoute({ pathname: "/mocks", search: "label=foo&label=foo&label=FOO" });
    givenApi({
      mocks: [
        aMock({ name: "Foo mock", labels: ["foo"] }),
        aMock({ name: "Plain mock", labels: [] }),
      ],
    });
    renderWithProviders(<MocksPage />);

    await findMocksList();
    expect(getListedMockNames()).toEqual(["Mock: Foo mock"]);
    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/mocks?label=foo",
    );
  });

  it("drops empty query values on load", async () => {
    givenRoute({ pathname: "/mocks", search: "q=&label=" });
    givenApi({
      mocks: [aMock({ name: "First" }), aMock({ name: "Second" })],
    });
    renderWithProviders(<MocksPage />);

    await findMocksList();
    expect(getListedMockNames()).toHaveLength(2);
    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/mocks",
    );
  });

  it("round-trips labels with special characters through the URL", async () => {
    givenRoute({ pathname: "/mocks", search: "label=a%26b" });
    givenApi({
      mocks: [
        aMock({ name: "Amp mock", labels: ["a&b"] }),
        aMock({ name: "Plain mock", labels: [] }),
      ],
    });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    expect(getListedMockNames()).toEqual(["Mock: Amp mock"]);

    await user.click(screen.getByRole("button", { name: "a&b" }));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/mocks",
    );
    expect(getListedMockNames()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "a&b" }));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/mocks?label=a%26b",
    );
    expect(getListedMockNames()).toEqual(["Mock: Amp mock"]);
  });

  it("writes search and label changes to the URL with replace", async () => {
    givenApi({ mocks: fixtures() });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    await user.click(screen.getByRole("button", { name: "users" }));
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/mocks?label=users",
    );

    await user.type(
      screen.getByRole("textbox", { name: "Search mocks" }),
      "get",
    );
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/mocks?q=get&label=users",
    );
    expect(router.push).not.toHaveBeenCalled();
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  it("clears filters back to a bare URL", async () => {
    givenRoute({ pathname: "/mocks", search: "q=nomatch&label=foo" });
    givenApi({
      mocks: [
        aMock({ name: "Foo mock", labels: ["foo"] }),
        aMock({ name: "Plain mock", labels: [] }),
      ],
    });
    const { user } = renderWithProviders(<MocksPage />);

    await findEmptyFilterState();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/mocks",
    );
    expect(getListedMockNames()).toHaveLength(2);
    expect(screen.getByRole("textbox", { name: "Search mocks" })).toHaveValue(
      "",
    );
  });
});

describe("mocks page filters across mock detail", () => {
  function givenFilterableMocks() {
    givenApi({
      mocks: [
        aMock({
          id: "create-user-mock",
          name: "Create user",
          method: "POST",
          labels: ["users", "admin"],
        }),
        aMock({ name: "Get users", labels: ["users"] }),
        aMock({ name: "Get payments", labels: ["payments"] }),
      ],
      mockDetails: [
        aMockDetails({
          id: "create-user-mock",
          name: "Create user",
          method: "POST",
          labels: ["users", "admin"],
        }),
      ],
    });
  }

  async function renderFilteredList() {
    const list = renderWithProviders(<MocksPage />);
    await findMocksList();
    await list.user.click(screen.getByRole("button", { name: "users" }));
    await list.user.type(
      screen.getByRole("textbox", { name: "Search mocks" }),
      "create",
    );
    expect(getListedMockNames()).toEqual(["Mock: Create user"]);
    return list;
  }

  // jsdom cannot navigate, so tests re-point the route store where the
  // browser would have gone and render the destination page themselves.
  function browseTo(href: string, params: Record<string, string>) {
    const url = new URL(href, "http://localhost");
    givenRoute({
      pathname: url.pathname,
      params,
      search: url.search.replace(/^\?/, ""),
    });
  }

  async function renderEditPageForCreateUser() {
    const detail = renderWithProviders(<EditMockPage />);
    await screen.findByRole("form", { name: "Edit mock" });
    return detail;
  }

  async function expectListKeepsFilters() {
    expect(getRoute().pathname).toBe("/mocks");
    renderWithProviders(<MocksPage />);
    await findMocksList();
    expect(screen.getByRole("textbox", { name: "Search mocks" })).toHaveValue(
      "create",
    );
    expect(screen.getByRole("button", { name: "users" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(getListedMockNames()).toEqual(["Mock: Create user"]);
  }

  it("keeps search and selected labels after opening a mock and closing it", async () => {
    givenFilterableMocks();
    const list = await renderFilteredList();

    const href = screen
      .getByRole("link", { name: "Open Create user" })
      .getAttribute("href")!;
    list.unmount();
    browseTo(href, { id: "create-user-mock" });

    const detail = await renderEditPageForCreateUser();
    await detail.user.click(
      screen.getByRole("button", { name: "Close and return to mocks" }),
    );
    detail.unmount();

    await expectListKeepsFilters();
  });

  it("keeps filters when editing via the actions menu and closing", async () => {
    givenFilterableMocks();
    const list = await renderFilteredList();

    await list.user.click(
      screen.getByRole("button", { name: "Actions for Create user" }),
    );
    await list.user.click(
      await screen.findByRole("menuitem", { name: "Edit" }),
    );
    list.unmount();
    givenRoute({ ...getRoute(), params: { id: "create-user-mock" } });

    const detail = await renderEditPageForCreateUser();
    await detail.user.click(
      screen.getByRole("button", { name: "Close and return to mocks" }),
    );
    detail.unmount();

    await expectListKeepsFilters();
  });

  it("carries the filters into the new-mock and duplicate targets", async () => {
    givenFilterableMocks();
    const list = await renderFilteredList();

    expect(
      screen.getByRole("button", { name: "Create new mock" }),
    ).toHaveAttribute("href", "/mocks/new?q=create&label=users");

    await list.user.click(
      screen.getByRole("button", { name: "Actions for Create user" }),
    );
    await list.user.click(
      await screen.findByRole("menuitem", { name: "Duplicate" }),
    );
    expect(router.push).toHaveBeenLastCalledWith(
      "/mocks/new?from=create-user-mock&q=create&label=users",
    );
  });

  it("carries the filters into the duplicate action on the mock detail", async () => {
    givenFilterableMocks();
    const list = await renderFilteredList();

    const href = screen
      .getByRole("link", { name: "Open Create user" })
      .getAttribute("href")!;
    list.unmount();
    browseTo(href, { id: "create-user-mock" });

    const detail = await renderEditPageForCreateUser();
    await detail.user.click(
      screen.getByRole("button", { name: "Actions for Create user" }),
    );
    await detail.user.click(
      await screen.findByRole("menuitem", { name: "Duplicate" }),
    );
    expect(router.push).toHaveBeenLastCalledWith(
      "/mocks/new?from=create-user-mock&q=create&label=users",
    );
  });

  it("keeps filters after saving changes on the mock detail", async () => {
    givenFilterableMocks();
    server.use(
      http.patch("/api/mocks/:id", async () =>
        HttpResponse.json(
          aMockDetails({
            id: "create-user-mock",
            name: "Create user!",
            method: "POST",
            labels: ["users", "admin"],
          }),
        ),
      ),
    );
    const list = await renderFilteredList();

    const href = screen
      .getByRole("link", { name: "Open Create user" })
      .getAttribute("href")!;
    list.unmount();
    browseTo(href, { id: "create-user-mock" });

    const detail = await renderEditPageForCreateUser();
    await detail.user.type(screen.getByLabelText("Name"), "!");
    await detail.user.click(
      screen.getByRole("button", { name: "Save changes" }),
    );
    expect(await screen.findByText("Mock updated.")).toBeInTheDocument();
    detail.unmount();

    await expectListKeepsFilters();
  });
});

describe("mocks page header counts", () => {
  it("shows the total with the disabled count and switches to match counts while filtering", async () => {
    givenApi({
      mocks: [
        aMock({ name: "Get users", isEnabled: true, labels: ["users"] }),
        aMock({ name: "Create user", isEnabled: false, labels: ["users"] }),
        aMock({ name: "Get payments", isEnabled: true, labels: ["payments"] }),
      ],
    });
    const { user } = renderWithProviders(<MocksPage />);

    await findMocksList();
    expect(screen.getByText("3 mocks · 1 disabled")).toBeInTheDocument();

    const searchInput = screen.getByRole("textbox", { name: "Search mocks" });
    await user.type(searchInput, "user");
    expect(screen.getByText("2 of 3 mocks")).toBeInTheDocument();
    expect(screen.queryByText(/disabled/)).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(screen.getByText("3 mocks · 1 disabled")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "payments" }));
    expect(screen.getByText("1 of 3 mocks")).toBeInTheDocument();
  });

  it("collapses to the total when every mock is enabled", async () => {
    givenApi({
      mocks: [aMock({ name: "First" }), aMock({ name: "Second" })],
    });
    renderWithProviders(<MocksPage />);

    await findMocksList();
    expect(screen.getByText("2 mocks")).toBeInTheDocument();
    expect(screen.queryByText(/disabled/)).not.toBeInTheDocument();
  });

  it("updates the disabled count when a mock is toggled", async () => {
    const state = givenApi({
      mocks: [aMock({ name: "Toggler", isEnabled: true })],
    });
    server.use(
      http.patch("/api/mocks/:id", async ({ params, request }) => {
        const payload = (await request.json()) as { isEnabled: boolean };
        state.mocks = state.mocks.map((mock) =>
          mock.id === params.id
            ? { ...mock, isEnabled: payload.isEnabled }
            : mock,
        );
        return HttpResponse.json(state.mocks[0]);
      }),
    );

    const { user } = renderWithProviders(<MocksPage />);
    await findMocksList();
    expect(screen.getByText("1 mock")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Actions for Toggler" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Disable" }));

    expect(await screen.findByText("1 mock · 1 disabled")).toBeInTheDocument();
    expect(await screen.findByText("Mock disabled.")).toBeInTheDocument();
  });

  it("hides the counts when mocks cannot be fetched", async () => {
    givenApi();
    givenApiError("get", "/api/mocks");
    renderWithProviders(<MocksPage />);

    await screen.findByText("Could not fetch mocks");
    expect(screen.queryByText("0 mocks")).not.toBeInTheDocument();
  });
});

describe("mocks page duplicate flow", () => {
  it("opens the prefilled new-mock page from the actions menu", async () => {
    givenApi({ mocks: [aMock({ id: "mock-1", name: "Get users" })] });
    const { user } = renderWithProviders(<MocksPage />);
    await findMocksList();

    await user.click(
      screen.getByRole("button", { name: "Actions for Get users" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Duplicate" }),
    );

    expect(router.push).toHaveBeenCalledWith("/mocks/new?from=mock-1");
  });
});

describe("mocks page delete flow", () => {
  it("skips confirmation for the rest of the browser session", async () => {
    const first = aMock({ id: "first-mock", name: "First mock" });
    const second = aMock({ id: "second-mock", name: "Second mock" });
    const state = givenApi({ mocks: [first, second] });

    const deletedIds: string[] = [];
    server.use(
      http.delete("/api/mocks/:id", ({ params }) => {
        const id = String(params.id);
        deletedIds.push(id);
        state.mocks = state.mocks.filter((mock) => mock.id !== id);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user, unmount } = renderWithProviders(<MocksPage />);
    await findMocksList();

    await user.click(
      screen.getByRole("button", { name: "Actions for First mock" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Delete mock");
    expect(dialog).toHaveTextContent("First mock");
    expect(deletedIds).toEqual([]);

    await user.click(
      within(dialog).getByRole("checkbox", {
        name: "Don't ask again this session",
      }),
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirm deletion of First mock",
      }),
    );

    await waitFor(() => expect(getListedMockNames()).toHaveLength(1));
    expect(deletedIds).toEqual(["first-mock"]);
    expect(await screen.findByText("Mock deleted.")).toBeInTheDocument();

    unmount();
    const { user: remountedUser } = renderWithProviders(<MocksPage />);
    await findMocksList();

    await remountedUser.click(
      screen.getByRole("button", { name: "Actions for Second mock" }),
    );
    await remountedUser.click(
      await screen.findByRole("menuitem", { name: "Delete" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(deletedIds).toEqual(["first-mock", "second-mock"]),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("list", { name: "Mocks list" }),
      ).not.toBeInTheDocument(),
    );
  });
});

describe("mocks page failure handling", () => {
  it("shows a callout when mocks cannot be fetched", async () => {
    givenApi();
    givenApiError("get", "/api/mocks");
    renderWithProviders(<MocksPage />);

    expect(
      await screen.findByText("Could not fetch mocks"),
    ).toBeInTheDocument();
  });

  it("shows an error toast and keeps the mock enabled when disabling fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    givenApi({ mocks: [aMock({ name: "Fragile mock", isEnabled: true })] });
    givenApiError("patch", "/api/mocks/:id");

    const { user } = renderWithProviders(<MocksPage />);
    await findMocksList();

    await user.click(
      screen.getByRole("button", { name: "Actions for Fragile mock" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Disable" }));

    expect(
      await screen.findByText("Failed to disable mock"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Disabled")).not.toBeInTheDocument();
  });
});

describe("mocks page conflict badges", () => {
  it("renders Conflict and Shadowed badges on the offending rows", async () => {
    givenApi({
      mocks: [
        aMock({ name: "Conflict mock", annotations: ["CONFLICT"] }),
        aMock({
          name: "Shadowed mock",
          annotations: ["READ_ONLY", "SHADOWED"],
        }),
        aMock({ name: "Plain mock" }),
      ],
    });
    renderWithProviders(<MocksPage />);

    const conflictCard = await screen.findByRole("listitem", {
      name: "Mock: Conflict mock",
    });
    expect(within(conflictCard).getByText("Conflict")).toBeInTheDocument();

    const shadowedCard = screen.getByRole("listitem", {
      name: "Mock: Shadowed mock",
    });
    expect(within(shadowedCard).getByText("Shadowed")).toBeInTheDocument();

    const plainCard = screen.getByRole("listitem", {
      name: "Mock: Plain mock",
    });
    expect(within(plainCard).queryByText("Conflict")).not.toBeInTheDocument();
    expect(within(plainCard).queryByText("Shadowed")).not.toBeInTheDocument();
  });

  it("renders the Invalid Template badge on migrated mocks with broken templates", async () => {
    givenApi({
      mocks: [
        aMock({ name: "Broken mock", annotations: ["INVALID_TEMPLATE"] }),
        aMock({ name: "Plain mock" }),
      ],
    });
    renderWithProviders(<MocksPage />);

    const brokenCard = await screen.findByRole("listitem", {
      name: "Mock: Broken mock",
    });
    expect(
      within(brokenCard).getByText("Invalid Template"),
    ).toBeInTheDocument();

    const plainCard = screen.getByRole("listitem", {
      name: "Mock: Plain mock",
    });
    expect(
      within(plainCard).queryByText("Invalid Template"),
    ).not.toBeInTheDocument();
  });
});
