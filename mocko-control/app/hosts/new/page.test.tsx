import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import NewHostPage from "./page";
import { aHost } from "@/test/fixtures";
import { givenApi, server } from "@/test/msw";
import { router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import type { CreateHostDto } from "@/lib/types/host-dtos";

function capturePosts(): CreateHostDto[] {
  const payloads: CreateHostDto[] = [];
  server.use(
    http.post("/api/hosts", async ({ request }) => {
      payloads.push((await request.json()) as CreateHostDto);
      return HttpResponse.json(aHost(), { status: 201 });
    }),
  );
  return payloads;
}

async function fillValidHost(user: UserEvent) {
  await user.type(screen.getByLabelText("Slug"), "payments");
  await user.type(screen.getByLabelText("Source"), "payments.local");
}

describe("new host page validation", () => {
  it("rejects missing and malformed slugs and requires a source", async () => {
    givenApi();
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewHostPage />);

    await user.click(screen.getByRole("button", { name: "Add host" }));
    expect(await screen.findByText("Slug is required.")).toBeInTheDocument();
    expect(screen.getByText("Source is required.")).toBeInTheDocument();

    const slug = screen.getByLabelText("Slug");
    await user.type(slug, "has space");
    expect(screen.queryByText("Slug is required.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add host" }));
    expect(await screen.findByText("Invalid format.")).toBeInTheDocument();

    await user.clear(slug);
    await user.type(slug, "abcdefghijklm");
    await user.click(screen.getByRole("button", { name: "Add host" }));
    expect(await screen.findByText("Invalid format.")).toBeInTheDocument();

    expect(payloads).toHaveLength(0);
  });

  it("rejects a destination that is not a URL", async () => {
    givenApi();
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewHostPage />);

    await fillValidHost(user);
    await user.type(
      screen.getByLabelText("Destination (optional)"),
      "not a url",
    );
    await user.click(screen.getByRole("button", { name: "Add host" }));

    expect(
      await screen.findByText("Destination must be a valid URL."),
    ).toBeInTheDocument();
    expect(payloads).toHaveLength(0);
  });
});

describe("new host page submission", () => {
  it("omits the destination key when blank and redirects after create", async () => {
    givenApi();
    const payloads = capturePosts();
    const { user } = renderWithProviders(<NewHostPage />);

    await fillValidHost(user);
    await user.type(
      screen.getByLabelText("Name (optional)"),
      "Payments service",
    );
    await user.click(screen.getByRole("button", { name: "Add host" }));

    expect(await screen.findByText("Host created.")).toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/hosts");
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toEqual({
      slug: "payments",
      name: "Payments service",
      source: "payments.local",
    });
    expect(payloads[0]).not.toHaveProperty("destination");
  });

  it("shows an inline slug error on HOST_SLUG_CONFLICT", async () => {
    givenApi();
    server.use(
      http.post("/api/hosts", () =>
        HttpResponse.json(
          {
            code: "HOST_SLUG_CONFLICT",
            message: 'Host "payments" already exists',
          },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderWithProviders(<NewHostPage />);

    await fillValidHost(user);
    await user.click(screen.getByRole("button", { name: "Add host" }));

    expect(
      await screen.findByText("A host with this slug already exists"),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalledWith("/hosts");
  });

  it("toasts and stays editable on unexpected server errors", async () => {
    givenApi();
    server.use(
      http.post("/api/hosts", () =>
        HttpResponse.json({ message: "Simulated failure" }, { status: 500 }),
      ),
    );
    const { user } = renderWithProviders(<NewHostPage />);

    await fillValidHost(user);
    await user.click(screen.getByRole("button", { name: "Add host" }));

    expect(
      await screen.findByText("Failed to create host."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Slug")).toHaveValue("payments");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add host" })).toBeEnabled(),
    );
  });
});
