import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import FlagsPage from "./page";
import { aFlagKey } from "@/test/fixtures";
import { givenApi, server } from "@/test/msw";
import { givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";

async function findFlagsList() {
  return await screen.findByRole("list", { name: "Flags and folders" });
}

describe("flags page navigation", () => {
  it("renders folders and flags at the root with prefix links", async () => {
    givenRoute({ pathname: "/flags" });
    givenApi({
      flagList: {
        flagKeys: [
          aFlagKey({ type: "PREFIX", name: "payments", count: 2 }),
          aFlagKey({ name: "maintenance" }),
        ],
        isTruncated: false,
      },
    });
    renderWithProviders(<FlagsPage />);

    await findFlagsList();
    expect(
      screen.getByRole("link", { name: "Open folder payments" }),
    ).toHaveAttribute("href", "/flags?prefix=payments%3A");
    expect(
      screen.getByRole("link", { name: "Open flag maintenance" }),
    ).toHaveAttribute("href", "/flags/maintenance");
    expect(
      screen.getByRole("button", { name: "Create new flag" }),
    ).toHaveAttribute("href", "/flags/new");
  });

  it("composes nested folder links and breadcrumbs inside a prefix", async () => {
    givenRoute({ pathname: "/flags", search: "prefix=payments:" });
    givenApi({
      flagList: {
        flagKeys: [
          aFlagKey({ type: "PREFIX", name: "eu", count: 1 }),
          aFlagKey({ name: "checkout" }),
        ],
        isTruncated: false,
      },
    });
    renderWithProviders(<FlagsPage />);

    await findFlagsList();
    expect(
      screen.getByRole("link", { name: "Open folder eu" }),
    ).toHaveAttribute("href", "/flags?prefix=payments%3Aeu%3A");
    expect(
      screen.getByRole("link", { name: "Open flag checkout" }),
    ).toHaveAttribute("href", "/flags/payments:checkout");
    expect(screen.getByRole("link", { name: "Flags" })).toHaveAttribute(
      "href",
      "/flags",
    );
    expect(
      screen.getByRole("button", { name: "Create new flag" }),
    ).toHaveAttribute("href", "/flags/new?prefix=payments:");
  });

  it("shows the empty-folder state and working breadcrumbs for a prefix that does not exist", async () => {
    givenRoute({ pathname: "/flags", search: "prefix=ghost:town:" });
    givenApi();
    renderWithProviders(<FlagsPage />);

    expect(
      await screen.findByText("No flags exist for this prefix yet."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Flags" })).toHaveAttribute(
      "href",
      "/flags",
    );
    expect(screen.getByRole("link", { name: "ghost" })).toHaveAttribute(
      "href",
      "/flags?prefix=ghost%3A",
    );
  });

  it("warns when the flag list is truncated", async () => {
    givenApi({
      flagList: {
        flagKeys: [aFlagKey({ name: "one" })],
        isTruncated: true,
      },
    });
    renderWithProviders(<FlagsPage />);

    await findFlagsList();
    expect(screen.getByText("Flag list is truncated")).toBeInTheDocument();
  });
});

describe("flags page search", () => {
  it("keeps the search in the URL and clears back out of the empty state", async () => {
    givenRoute({ pathname: "/flags", search: "prefix=payments:" });
    givenApi();
    server.use(
      http.get("/api/flags", ({ request }) => {
        const query = new URL(request.url).searchParams.get("q");
        return HttpResponse.json({
          flagKeys: query ? [] : [aFlagKey({ name: "checkout" })],
          isTruncated: false,
        });
      }),
    );
    const { user } = renderWithProviders(<FlagsPage />);

    await findFlagsList();
    await user.type(
      screen.getByRole("textbox", { name: "Search flags and folders" }),
      "zzz",
    );

    expect(router.replace).toHaveBeenLastCalledWith(
      "/flags?prefix=payments%3A&q=zzz",
      { scroll: false },
    );
    expect(await screen.findByText("No items match “zzz”")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(router.replace).toHaveBeenLastCalledWith(
      "/flags?prefix=payments%3A",
      { scroll: false },
    );
    const list = await findFlagsList();
    expect(within(list).getByRole("listitem")).toHaveAccessibleName(
      "Flag: checkout",
    );
    expect(
      screen.getByRole("textbox", { name: "Search flags and folders" }),
    ).toHaveValue("");
  });
});

describe("flags page delete flow", () => {
  it("asks for confirmation and skips it after don't ask again", async () => {
    const state = givenApi({
      flagList: {
        flagKeys: [aFlagKey({ name: "one" }), aFlagKey({ name: "two" })],
        isTruncated: false,
      },
    });

    const deletedKeys: string[] = [];
    server.use(
      http.delete("/api/flags/:key", ({ params }) => {
        const key = decodeURIComponent(String(params.key));
        deletedKeys.push(key);
        state.flagList = {
          flagKeys: state.flagList.flagKeys.filter((item) => item.name !== key),
          isTruncated: false,
        };
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<FlagsPage />);
    await findFlagsList();

    await user.click(screen.getByRole("button", { name: "Actions for one" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Delete flag");
    expect(deletedKeys).toEqual([]);

    await user.click(
      within(dialog).getByRole("checkbox", {
        name: "Don't ask again this session",
      }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm deletion of one" }),
    );

    await waitFor(() => expect(deletedKeys).toEqual(["one"]));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Actions for one" }),
      ).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Actions for two" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(deletedKeys).toEqual(["one", "two"]));
  });

  it("shows the empty-folder state after deleting the last flag under a prefix", async () => {
    givenRoute({ pathname: "/flags", search: "prefix=payments:" });
    const state = givenApi({
      flagList: {
        flagKeys: [aFlagKey({ name: "checkout" })],
        isTruncated: false,
      },
    });

    const deletedKeys: string[] = [];
    server.use(
      http.delete("/api/flags/:key", ({ params }) => {
        deletedKeys.push(decodeURIComponent(String(params.key)));
        state.flagList = { flagKeys: [], isTruncated: false };
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<FlagsPage />);
    await findFlagsList();

    await user.click(
      screen.getByRole("button", { name: "Actions for checkout" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Confirm deletion of payments:checkout",
      }),
    );

    expect(
      await screen.findByText("No flags exist for this prefix yet."),
    ).toBeInTheDocument();
    expect(deletedKeys).toEqual(["payments:checkout"]);
    expect(
      screen.queryByRole("list", { name: "Flags and folders" }),
    ).not.toBeInTheDocument();
  });
});
