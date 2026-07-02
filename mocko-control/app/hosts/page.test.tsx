import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import HostsPage from "./page";
import { aHost } from "@/test/fixtures";
import { givenApi, givenApiError, server } from "@/test/msw";
import { renderWithProviders } from "@/test/render";

describe("hosts page delete flow", () => {
  it("asks for confirmation before deleting a host", async () => {
    const state = givenApi({
      hosts: [aHost({ slug: "alpha" }), aHost({ slug: "beta" })],
    });

    const deletedSlugs: string[] = [];
    server.use(
      http.delete("/api/hosts/:slug", ({ params }) => {
        const slug = String(params.slug);
        deletedSlugs.push(slug);
        state.hosts = state.hosts.filter((host) => host.slug !== slug);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<HostsPage />);
    const list = await screen.findByRole("list", { name: "Hosts list" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Actions for alpha" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Delete host");
    expect(dialog).toHaveTextContent("alpha");
    expect(deletedSlugs).toEqual([]);

    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirm deletion of alpha",
      }),
    );

    expect(await screen.findByText("Host deleted.")).toBeInTheDocument();
    expect(deletedSlugs).toEqual(["alpha"]);
    await waitFor(() =>
      expect(
        within(screen.getByRole("list", { name: "Hosts list" })).getAllByRole(
          "listitem",
        ),
      ).toHaveLength(1),
    );
  });

  it("toasts when deleting a host fails", async () => {
    givenApi({ hosts: [aHost({ slug: "fragile" })] });
    givenApiError("delete", "/api/hosts/:slug");

    const { user } = renderWithProviders(<HostsPage />);
    await screen.findByRole("list", { name: "Hosts list" });

    await user.click(
      screen.getByRole("button", { name: "Actions for fragile" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Confirm deletion of fragile",
      }),
    );

    expect(
      await screen.findByText("Failed to delete host."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "Host: fragile" }),
    ).toBeInTheDocument();
  });
});

describe("hosts page failure handling", () => {
  it("shows a callout when hosts cannot be fetched", async () => {
    givenApi();
    givenApiError("get", "/api/hosts");
    renderWithProviders(<HostsPage />);

    expect(
      await screen.findByText("Could not fetch hosts"),
    ).toBeInTheDocument();
  });
});
