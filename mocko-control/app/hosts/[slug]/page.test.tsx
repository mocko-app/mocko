import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import HostDetailPage from "./page";
import { aHost } from "@/test/fixtures";
import { givenApi, server } from "@/test/msw";
import { givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import type { PatchHostDto } from "@/lib/types/host-dtos";

function capturePatches(): PatchHostDto[] {
  const payloads: PatchHostDto[] = [];
  server.use(
    http.patch("/api/hosts/:slug", async ({ request }) => {
      payloads.push((await request.json()) as PatchHostDto);
      return HttpResponse.json(aHost());
    }),
  );
  return payloads;
}

function givenEditableHost() {
  givenRoute({ pathname: "/hosts/payments", params: { slug: "payments" } });
  givenApi({
    hosts: [
      aHost({
        slug: "payments",
        name: "Payments",
        source: "payments.local",
        destination: "http://localhost:9001",
      }),
    ],
  });
}

describe("host detail page", () => {
  it("shows the slug statically and clears the destination with null", async () => {
    givenEditableHost();
    const payloads = capturePatches();
    const { user } = renderWithProviders(<HostDetailPage />);

    await screen.findByRole("form", { name: "Edit host" });
    expect(screen.getByLabelText("Slug: payments")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Slug" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Destination (optional)")).toHaveValue(
      "http://localhost:9001",
    );

    await user.clear(screen.getByLabelText("Destination (optional)"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Host updated.")).toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/hosts");
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toEqual({
      name: "Payments",
      source: "payments.local",
      destination: null,
    });
    expect(payloads[0].destination).toBeNull();
  });

  it("closes without asking when nothing was changed", async () => {
    givenEditableHost();
    const { user } = renderWithProviders(<HostDetailPage />);
    await screen.findByRole("form", { name: "Edit host" });

    await user.click(
      screen.getByRole("button", { name: "Close and return to hosts" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/hosts");
  });

  it("asks before closing with unsaved edits and keeps them on cancel", async () => {
    givenEditableHost();
    const { user } = renderWithProviders(<HostDetailPage />);
    await screen.findByRole("form", { name: "Edit host" });

    await user.type(screen.getByLabelText("Name (optional)"), " service");
    await user.click(
      screen.getByRole("button", { name: "Close and return to hosts" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Unsaved changes");

    await user.click(
      within(dialog).getByRole("button", { name: "Keep editing" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Name (optional)")).toHaveValue(
      "Payments service",
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("discards unsaved edits from cancel when confirmed", async () => {
    givenEditableHost();
    const { user } = renderWithProviders(<HostDetailPage />);
    await screen.findByRole("form", { name: "Edit host" });

    await user.type(screen.getByLabelText("Name (optional)"), " service");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Discard changes" }),
    );

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/hosts"));
  });

  it("renders a read-only host without a save button", async () => {
    givenRoute({ pathname: "/hosts/legacy", params: { slug: "legacy" } });
    givenApi({
      hosts: [
        aHost({
          slug: "legacy",
          source: "legacy.local",
          annotations: ["READ_ONLY"],
        }),
      ],
    });
    const { user } = renderWithProviders(<HostDetailPage />);

    await screen.findByRole("form", { name: "View host" });
    expect(screen.getByText("Read-only host")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name (optional)")).toBeDisabled();
    expect(screen.getByLabelText("Source")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/hosts");
  });

  it("shows the not-found callout for a missing host", async () => {
    givenRoute({ pathname: "/hosts/gone", params: { slug: "gone" } });
    givenApi();
    renderWithProviders(<HostDetailPage />);

    expect(await screen.findByText("Host not found")).toBeInTheDocument();
  });
});
