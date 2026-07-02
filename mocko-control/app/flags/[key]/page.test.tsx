import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import FlagDetailPage from "./page";
import { givenApi, givenApiError, server } from "@/test/msw";
import { givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import type { PutFlagDto } from "@/lib/types/flag-dtos";

function givenFlagRoute(key: string) {
  givenRoute({
    pathname: `/flags/${encodeURIComponent(key)}`,
    params: { key: encodeURIComponent(key) },
  });
}

async function findEditor() {
  return await screen.findByRole("textbox", { name: "Code editor" });
}

describe("flag detail page editing", () => {
  it("starts read-only, saves an edited value, and returns to read-only", async () => {
    givenFlagRoute("payments:checkout");
    const state = givenApi({
      flagValues: { "payments:checkout": { value: "true" } },
    });

    const puts: PutFlagDto[] = [];
    server.use(
      http.put("/api/flags/:key", async ({ request }) => {
        const payload = (await request.json()) as PutFlagDto;
        puts.push(payload);
        state.flagValues["payments:checkout"] = { value: payload.value };
        return HttpResponse.json({ value: payload.value });
      }),
    );

    const { user } = renderWithProviders(<FlagDetailPage />);

    expect(
      await screen.findByRole("heading", { name: "checkout" }),
    ).toBeInTheDocument();
    const editor = await findEditor();
    expect(editor).toHaveValue("true");
    expect(editor).toHaveAttribute("readonly");

    await user.click(screen.getByRole("button", { name: "Edit flag value" }));
    expect(await findEditor()).not.toHaveAttribute("readonly");

    await user.clear(await findEditor());
    await user.click(await findEditor());
    await user.paste("false");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0]).toEqual({ value: "false", source: "CONTROL" });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Edit flag value" }),
      ).toBeInTheDocument(),
    );
    expect(await findEditor()).toHaveAttribute("readonly");
    expect(await findEditor()).toHaveValue("false");
  });

  it("restores the initial value on cancel without sending anything", async () => {
    givenFlagRoute("payments:checkout");
    givenApi({ flagValues: { "payments:checkout": { value: "true" } } });

    const puts: PutFlagDto[] = [];
    server.use(
      http.put("/api/flags/:key", async ({ request }) => {
        puts.push((await request.json()) as PutFlagDto);
        return HttpResponse.json({ value: "" });
      }),
    );

    const { user } = renderWithProviders(<FlagDetailPage />);

    await screen.findByRole("heading", { name: "checkout" });
    await user.click(screen.getByRole("button", { name: "Edit flag value" }));
    await user.clear(await findEditor());
    await user.click(await findEditor());
    await user.paste("999");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await findEditor()).toHaveValue("true");
    expect(await findEditor()).toHaveAttribute("readonly");
    expect(puts).toHaveLength(0);
  });
});

describe("flag detail page delete flow", () => {
  it("deletes after confirmation and redirects to the parent folder", async () => {
    givenFlagRoute("payments:checkout");
    givenApi({ flagValues: { "payments:checkout": { value: "true" } } });

    const deletedKeys: string[] = [];
    server.use(
      http.delete("/api/flags/:key", ({ params }) => {
        deletedKeys.push(decodeURIComponent(String(params.key)));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<FlagDetailPage />);

    await screen.findByRole("heading", { name: "checkout" });
    await user.click(
      screen.getByRole("button", { name: "Delete flag payments:checkout" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(deletedKeys).toEqual([]);

    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirm deletion of payments:checkout",
      }),
    );

    await waitFor(() => expect(deletedKeys).toEqual(["payments:checkout"]));
    expect(router.push).toHaveBeenCalledWith("/flags?prefix=payments:");
  });

  it("redirects to the flags root when deleting a top-level flag", async () => {
    givenFlagRoute("standalone");
    givenApi({ flagValues: { standalone: { value: "1" } } });
    server.use(
      http.delete(
        "/api/flags/:key",
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    const { user } = renderWithProviders(<FlagDetailPage />);

    await screen.findByRole("heading", { name: "standalone" });
    await user.click(
      screen.getByRole("button", { name: "Delete flag standalone" }),
    );
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Confirm deletion of standalone",
      }),
    );

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/flags"));
  });

  it("surfaces the API message when deleting fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    givenFlagRoute("payments:checkout");
    givenApi({ flagValues: { "payments:checkout": { value: "true" } } });
    server.use(
      http.delete("/api/flags/:key", () =>
        HttpResponse.json({ message: "Redis unavailable" }, { status: 500 }),
      ),
    );

    const { user } = renderWithProviders(<FlagDetailPage />);

    await screen.findByRole("heading", { name: "checkout" });
    await user.click(
      screen.getByRole("button", { name: "Delete flag payments:checkout" }),
    );
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Confirm deletion of payments:checkout",
      }),
    );

    expect(await screen.findByText("Redis unavailable")).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("flag detail page load failures", () => {
  it("shows the not-found state for a flag that does not exist", async () => {
    givenFlagRoute("ghost");
    givenApi();
    renderWithProviders(<FlagDetailPage />);

    expect(await screen.findByText("Flag not found")).toBeInTheDocument();
    expect(
      screen.getByText("This flag does not exist or has expired."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to flags" }),
    ).toHaveAttribute("href", "/flags");
  });

  it("shows the load-error callout when fetching fails", async () => {
    givenFlagRoute("payments:checkout");
    givenApi();
    givenApiError("get", "/api/flags/:key");
    renderWithProviders(<FlagDetailPage />);

    expect(await screen.findByText("Could not load flag")).toBeInTheDocument();
    expect(screen.queryByText("Flag not found")).not.toBeInTheDocument();
  });
});
