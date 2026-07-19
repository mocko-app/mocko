import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import NewCallbackPage from "./page";
import { aCallback, aHost } from "@/test/fixtures";
import { givenApi, server } from "@/test/msw";
import { router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import type { CreateCallbackDto } from "@/lib/types/callback-dtos";

function captureCreates(status = 201): CreateCallbackDto[] {
  const payloads: CreateCallbackDto[] = [];
  server.use(
    http.post("/api/callbacks", async ({ request }) => {
      payloads.push((await request.json()) as CreateCallbackDto);
      if (status === 201) {
        return HttpResponse.json(aCallback(), { status });
      }
      return HttpResponse.json(
        {
          code: "CALLBACK_SLUG_CONFLICT",
          message: 'Callback "dup" already exists',
        },
        { status },
      );
    }),
  );
  return payloads;
}

describe("new callback page", () => {
  it("creates a URL-targeted callback", async () => {
    givenApi();
    const payloads = captureCreates();
    const { user } = renderWithProviders(<NewCallbackPage />);

    await screen.findByRole("form", { name: "Add callback" });
    await user.type(
      screen.getByRole("textbox", { name: "Slug" }),
      "order-shipped",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Name (optional)" }),
      "Order shipped",
    );
    await user.click(screen.getByRole("button", { name: "URL" }));
    await user.type(
      screen.getByRole("textbox", { name: "URL" }),
      "http://orders.local/shipped",
    );
    await user.clear(screen.getByLabelText("Delay (ms)"));
    await user.type(screen.getByLabelText("Delay (ms)"), "1500");
    await user.type(
      await screen.findByRole("textbox", { name: "Code editor" }),
      '"ok"',
    );
    await user.click(screen.getByRole("button", { name: "Add callback" }));

    expect(await screen.findByText("Callback created.")).toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/callbacks");
    expect(payloads).toEqual([
      {
        slug: "order-shipped",
        name: "Order shipped",
        method: "POST",
        url: "http://orders.local/shipped",
        delay: 1500,
        headers: {},
        body: '"ok"',
      },
    ]);
  });

  it("shows validation errors without sending a request", async () => {
    givenApi({ hosts: [aHost({ slug: "workflows" })] });
    const payloads = captureCreates();
    const { user } = renderWithProviders(<NewCallbackPage />);

    await screen.findByRole("form", { name: "Add callback" });
    await user.click(screen.getByRole("button", { name: "Add callback" }));

    expect(await screen.findByText("Slug is required.")).toBeInTheDocument();
    expect(screen.getByText("Host is required.")).toBeInTheDocument();
    expect(screen.getByText("Path is required.")).toBeInTheDocument();
    expect(payloads).toHaveLength(0);
  });

  it("disables the host select and suggests alternatives when there are no hosts", async () => {
    givenApi();
    renderWithProviders(<NewCallbackPage />);

    await screen.findByRole("form", { name: "Add callback" });
    expect(
      await screen.findByRole("combobox", { name: "Host" }),
    ).toBeDisabled();
    expect(screen.getByText(/or target a URL instead/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add a host" })).toHaveAttribute(
      "href",
      "/hosts/new",
    );
  });

  it("shows an inline error when the slug already exists", async () => {
    givenApi();
    captureCreates(409);
    const { user } = renderWithProviders(<NewCallbackPage />);

    await screen.findByRole("form", { name: "Add callback" });
    await user.type(screen.getByRole("textbox", { name: "Slug" }), "dup");
    await user.click(screen.getByRole("button", { name: "URL" }));
    await user.type(
      screen.getByRole("textbox", { name: "URL" }),
      "http://localhost:9001/dup",
    );
    await user.click(screen.getByRole("button", { name: "Add callback" }));

    expect(
      await screen.findByText("A callback with this slug already exists"),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("selects a host from the existing hosts", async () => {
    givenApi({
      hosts: [
        { slug: "workflows", source: "wf.local", annotations: [] },
        { slug: "payments", source: "pay.local", annotations: [] },
      ].map((host) => ({ name: undefined, destination: undefined, ...host })),
    });
    const payloads = captureCreates();
    const { user } = renderWithProviders(<NewCallbackPage />);

    await screen.findByRole("form", { name: "Add callback" });
    await user.type(
      screen.getByRole("textbox", { name: "Slug" }),
      "payment-approved",
    );

    await user.click(screen.getByRole("combobox", { name: "Host" }));
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByText("@workflows"));

    await user.type(
      screen.getByRole("textbox", { name: "Path" }),
      "/payments/approved",
    );
    await user.click(screen.getByRole("button", { name: "Add callback" }));

    expect(await screen.findByText("Callback created.")).toBeInTheDocument();
    expect(payloads).toEqual([
      {
        slug: "payment-approved",
        method: "POST",
        host: "workflows",
        path: "/payments/approved",
        delay: 0,
        headers: {},
      },
    ]);
  });
});
