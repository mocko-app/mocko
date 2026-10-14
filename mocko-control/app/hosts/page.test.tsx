import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import HostsPage from "./page";
import { aHost } from "@/test/fixtures";
import { givenApi, givenApiError, server } from "@/test/msw";
import { renderWithProviders } from "@/test/render";

describe("hosts page loading state", () => {
  it("shows the loading state instead of the empty state while hosts are loading", async () => {
    givenApi();
    let resolveHosts: () => void = () => {};
    const hostsResponse = new Promise<Response>((resolve) => {
      resolveHosts = () => resolve(HttpResponse.json([]));
    });
    server.use(http.get("/api/hosts", () => hostsResponse));

    renderWithProviders(<HostsPage />);

    expect(
      await screen.findByRole("status", { name: "Loading hosts" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("No hosts yet")).not.toBeInTheDocument();

    resolveHosts();
    expect(await screen.findByText("No hosts yet")).toBeInTheDocument();
  });
});

describe("hosts page delete flow", () => {
  it("asks for confirmation before deleting a host", async () => {
    const state = givenApi({
      hosts: [
        aHost({ id: "alpha-id", slug: "alpha" }),
        aHost({ id: "beta-id", slug: "beta" }),
      ],
    });

    const deletedIds: string[] = [];
    server.use(
      http.delete("/api/hosts/:id", ({ params }) => {
        const id = String(params.id);
        deletedIds.push(id);
        state.hosts = state.hosts.filter((host) => host.id !== id);
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
    expect(deletedIds).toEqual([]);

    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirm deletion of alpha",
      }),
    );

    expect(await screen.findByText("Host deleted.")).toBeInTheDocument();
    expect(deletedIds).toEqual(["alpha-id"]);
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
    givenApiError("delete", "/api/hosts/:id");

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

describe("hosts page shared slugs", () => {
  it("lists every host of a shared slug with its role badge and id link", async () => {
    givenApi({
      hosts: [
        aHost({ id: "ui-id", slug: "shared", annotations: [] }),
        aHost({
          id: "file-id",
          slug: "Shared",
          filePath: "hosts/shared.hcl",
          annotations: ["READ_ONLY", "SHADOWED"],
        }),
        aHost({
          id: "dup-a",
          slug: "dup",
          filePath: "hosts/a.hcl",
          annotations: ["READ_ONLY", "CONFLICT"],
        }),
        aHost({
          id: "dup-b",
          slug: "dup",
          filePath: "hosts/b.hcl",
          annotations: ["READ_ONLY", "CONFLICT"],
        }),
      ],
    });
    renderWithProviders(<HostsPage />);

    const list = await screen.findByRole("list", { name: "Hosts list" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);

    const uiCard = screen.getByRole("listitem", { name: "Host: shared" });
    expect(
      within(uiCard).getByRole("link", { name: "Open shared" }),
    ).toHaveAttribute("href", "/hosts/ui-id");
    expect(within(uiCard).queryByText("Shadowed")).not.toBeInTheDocument();
    expect(within(uiCard).queryByText("Conflict")).not.toBeInTheDocument();

    const fileCard = screen.getByRole("listitem", { name: "Host: Shared" });
    expect(
      within(fileCard).getByRole("link", { name: "Open Shared" }),
    ).toHaveAttribute("href", "/hosts/file-id");
    expect(within(fileCard).getByText("Shadowed")).toBeInTheDocument();
    expect(within(fileCard).getByText("hosts/shared.hcl")).toBeInTheDocument();

    const dupCards = screen.getAllByRole("listitem", { name: "Host: dup" });
    expect(dupCards).toHaveLength(2);
    expect(
      dupCards.map((card) =>
        within(card)
          .getByRole("link", { name: "Open dup" })
          .getAttribute("href"),
      ),
    ).toEqual(["/hosts/dup-a", "/hosts/dup-b"]);
    for (const card of dupCards) {
      expect(within(card).getByText("Conflict")).toBeInTheDocument();
    }
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
    expect(screen.queryByText("0 hosts")).not.toBeInTheDocument();
  });
});

describe("hosts page header counts", () => {
  it("shows the host count", async () => {
    givenApi({ hosts: [aHost(), aHost(), aHost()] });
    renderWithProviders(<HostsPage />);

    await screen.findByRole("list", { name: "Hosts list" });
    expect(screen.getByText("3 hosts")).toBeInTheDocument();
  });

  it("uses the singular form for a single host", async () => {
    givenApi({ hosts: [aHost()] });
    renderWithProviders(<HostsPage />);

    await screen.findByRole("list", { name: "Hosts list" });
    expect(screen.getByText("1 host")).toBeInTheDocument();
  });
});
