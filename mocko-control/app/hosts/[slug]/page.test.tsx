import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
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

describe("host detail page", () => {
  it("shows the slug statically and clears the destination with null", async () => {
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
    renderWithProviders(<HostDetailPage />);

    await screen.findByRole("form", { name: "View host" });
    expect(screen.getByText("Read-only host")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name (optional)")).toBeDisabled();
    expect(screen.getByLabelText("Source")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute(
      "href",
      "/hosts",
    );
  });

  it("shows the not-found callout for a missing host", async () => {
    givenRoute({ pathname: "/hosts/gone", params: { slug: "gone" } });
    givenApi();
    renderWithProviders(<HostDetailPage />);

    expect(await screen.findByText("Host not found")).toBeInTheDocument();
  });
});
