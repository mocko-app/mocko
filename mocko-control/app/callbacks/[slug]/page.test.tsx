import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import CallbackDetailPage from "./page";
import { aCallback } from "@/test/fixtures";
import { givenApi, server } from "@/test/msw";
import { givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import type { PatchCallbackDto } from "@/lib/types/callback-dtos";

function capturePatches(): PatchCallbackDto[] {
  const payloads: PatchCallbackDto[] = [];
  server.use(
    http.patch("/api/callbacks/:slug", async ({ request }) => {
      payloads.push((await request.json()) as PatchCallbackDto);
      return HttpResponse.json(aCallback());
    }),
  );
  return payloads;
}

function givenEditableCallback() {
  givenRoute({
    pathname: "/callbacks/payment-approved",
    params: { slug: "payment-approved" },
  });
  givenApi({
    callbacks: [
      aCallback({
        slug: "payment-approved",
        name: "Payment approved",
        method: "POST",
        host: "workflows",
        path: "/payments/approved",
        delay: 2000,
        headers: { "X-Source": "mocko" },
        body: '{ "key": "{{payload.key}}" }',
      }),
    ],
  });
}

describe("callback detail page", () => {
  it("shows the slug statically and saves edits", async () => {
    givenEditableCallback();
    const payloads = capturePatches();
    const { user } = renderWithProviders(<CallbackDetailPage />);

    await screen.findByRole("form", { name: "Edit callback" });
    expect(screen.getByLabelText("Slug: payment-approved")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Slug" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Path" })).toHaveValue(
      "/payments/approved",
    );
    expect(
      await screen.findByRole("textbox", { name: "Code editor" }),
    ).toHaveValue('{ "key": "{{payload.key}}" }');

    await user.clear(screen.getByLabelText("Delay (ms)"));
    await user.type(screen.getByLabelText("Delay (ms)"), "5000");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Callback updated.")).toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/callbacks");
    expect(payloads).toEqual([
      {
        name: "Payment approved",
        method: "POST",
        host: "workflows",
        path: "/payments/approved",
        delay: 5000,
        headers: { "X-Source": "mocko" },
        body: '{ "key": "{{payload.key}}" }',
      },
    ]);
  });

  it("asks before closing with unsaved edits", async () => {
    givenEditableCallback();
    const { user } = renderWithProviders(<CallbackDetailPage />);
    await screen.findByRole("form", { name: "Edit callback" });

    await user.type(
      screen.getByRole("textbox", { name: "Name (optional)" }),
      " v2",
    );
    await user.click(
      screen.getByRole("button", { name: "Close and return to callbacks" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Unsaved changes");

    await user.click(
      within(dialog).getByRole("button", { name: "Discard changes" }),
    );
    expect(router.push).toHaveBeenCalledWith("/callbacks");
  });

  it("renders a read-only callback without a save button", async () => {
    givenRoute({
      pathname: "/callbacks/file-callback",
      params: { slug: "file-callback" },
    });
    givenApi({
      callbacks: [
        aCallback({
          slug: "file-callback",
          annotations: ["READ_ONLY"],
        }),
      ],
    });
    const { user } = renderWithProviders(<CallbackDetailPage />);

    await screen.findByRole("form", { name: "View callback" });
    expect(screen.getByText("Read-only callback")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Name (optional)" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/callbacks");
  });

  it("shows the not-found callout for a missing callback", async () => {
    givenRoute({ pathname: "/callbacks/gone", params: { slug: "gone" } });
    givenApi();
    renderWithProviders(<CallbackDetailPage />);

    expect(await screen.findByText("Callback not found")).toBeInTheDocument();
  });
});
