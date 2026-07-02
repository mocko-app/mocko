import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import MocksPage from "./page";
import { aMock } from "@/test/fixtures";
import { givenApi, givenApiError, server } from "@/test/msw";
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

describe("mocks page filtering", () => {
  const fixtures = () => [
    aMock({ name: "Get users", method: "GET", labels: ["users"] }),
    aMock({ name: "Create user", method: "POST", labels: ["users", "admin"] }),
    aMock({ name: "Get payments", method: "GET", labels: ["payments"] }),
    aMock({ name: "Health check", method: "GET", labels: [] }),
  ];

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

describe("mocks page delete flow", () => {
  it("asks for confirmation and skips it after don't ask again", async () => {
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

    const { user } = renderWithProviders(<MocksPage />);
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

    await user.click(
      screen.getByRole("button", { name: "Actions for Second mock" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

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
