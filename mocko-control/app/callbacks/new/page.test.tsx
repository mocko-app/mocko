import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import NewCallbackPage from "./page";
import { aCallback, aCallbackDetails, aHost } from "@/test/fixtures";
import { givenApi, givenApiError, server } from "@/test/msw";
import { givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import type {
  CallbackDetailsDto,
  CreateCallbackDto,
} from "@/lib/types/callback-dtos";

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
        aHost({ slug: "workflows", source: "wf.local" }),
        aHost({ slug: "payments", source: "pay.local" }),
      ],
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

describe("new callback page override flow", () => {
  function givenFileCallback(overrides: Partial<CallbackDetailsDto> = {}) {
    givenRoute({ pathname: "/callbacks/new", search: "from=cb-file" });
    givenApi({
      hosts: [aHost({ slug: "workflows" })],
      callbackDetails: [
        aCallbackDetails({
          id: "cb-file",
          slug: "payment-approved",
          name: "Payment approved",
          method: "PUT",
          host: "workflows",
          path: "/payments/{{payload.id}}",
          url: undefined,
          delay: 250,
          headers: { "X-Signature": "abc" },
          body: '{"status":"approved"}',
          filePath: "callbacks/payments.hcl",
          annotations: ["READ_ONLY"],
          ...overrides,
        }),
      ],
    });
  }

  it("prefills every field from the file callback and creates a ui callback", async () => {
    givenFileCallback();
    const payloads = captureCreates();
    const { user } = renderWithProviders(<NewCallbackPage />);

    await screen.findByRole("form", { name: "Add callback" });
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue(
      "payment-approved",
    );
    expect(
      screen.getByRole("textbox", { name: "Name (optional)" }),
    ).toHaveValue("Payment approved");
    expect(
      screen.getByRole("combobox", { name: "HTTP method" }),
    ).toHaveTextContent("PUT");
    expect(screen.getByRole("combobox", { name: "Host" })).toHaveTextContent(
      "@workflows",
    );
    expect(screen.getByRole("textbox", { name: "Path" })).toHaveValue(
      "/payments/{{payload.id}}",
    );
    expect(screen.getByLabelText("Delay (ms)")).toHaveValue(250);
    expect(screen.getByLabelText("Header name 1")).toHaveValue("X-Signature");
    expect(screen.getByLabelText("Header value 1")).toHaveValue("abc");
    expect(
      await screen.findByRole("textbox", { name: "Code editor" }),
    ).toHaveValue('{"status":"approved"}');
    expect(screen.queryByLabelText("Source file")).not.toBeInTheDocument();
    expect(screen.queryByText("Read-only callback")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add callback" }));

    expect(await screen.findByText("Callback created.")).toBeInTheDocument();
    expect(payloads).toEqual([
      {
        slug: "payment-approved",
        name: "Payment approved",
        method: "PUT",
        host: "workflows",
        path: "/payments/{{payload.id}}",
        delay: 250,
        headers: { "X-Signature": "abc" },
        body: '{"status":"approved"}',
      },
    ]);
  });

  it("prefills a URL-targeted file callback", async () => {
    givenFileCallback({
      host: undefined,
      path: undefined,
      url: "http://orders.local/shipped",
    });
    renderWithProviders(<NewCallbackPage />);

    await screen.findByRole("form", { name: "Add callback" });
    expect(screen.getByRole("textbox", { name: "URL" })).toHaveValue(
      "http://orders.local/shipped",
    );
    expect(
      screen.queryByRole("textbox", { name: "Path" }),
    ).not.toBeInTheDocument();
  });

  it("closes an untouched prefill without asking", async () => {
    givenFileCallback();
    const { user } = renderWithProviders(<NewCallbackPage />);
    await screen.findByRole("form", { name: "Add callback" });

    await user.click(
      screen.getByRole("button", { name: "Close and return to callbacks" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/callbacks");
  });

  it("shows a notice and an empty form when the source callback is missing", async () => {
    givenRoute({ pathname: "/callbacks/new", search: "from=missing" });
    givenApi();
    renderWithProviders(<NewCallbackPage />);

    expect(await screen.findByText("Callback not found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The callback to override does not exist or is no longer available.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Path" })).toHaveValue("");
  });

  it("shows the load-error notice and an empty form when fetching fails", async () => {
    givenRoute({ pathname: "/callbacks/new", search: "from=cb-file" });
    givenApi();
    givenApiError("get", "/api/callbacks/:id");
    renderWithProviders(<NewCallbackPage />);

    expect(
      await screen.findByText("Could not load callback"),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue("");
  });
});
