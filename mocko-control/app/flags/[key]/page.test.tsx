import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
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
  it("opens editable and saves an edited value in place", async () => {
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
    expect(editor).not.toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    await user.clear(editor);
    await user.click(editor);
    await user.paste("false");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0]).toEqual({ value: "false", source: "CONTROL" });
    expect(await screen.findByText("Flag saved.")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeDisabled(),
    );
    expect(await findEditor()).toHaveValue("false");
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("flag detail page unsaved changes guard", () => {
  it("closes without asking when nothing was changed", async () => {
    givenFlagRoute("payments:checkout");
    givenApi({ flagValues: { "payments:checkout": { value: "true" } } });
    const { user } = renderWithProviders(<FlagDetailPage />);
    await screen.findByRole("heading", { name: "checkout" });

    await user.click(
      screen.getByRole("button", { name: "Close and return to flags" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/flags?prefix=payments:");
  });

  it("asks before closing with unsaved edits and keeps them on cancel", async () => {
    givenFlagRoute("payments:checkout");
    givenApi({ flagValues: { "payments:checkout": { value: "true" } } });
    const { user } = renderWithProviders(<FlagDetailPage />);
    await screen.findByRole("heading", { name: "checkout" });

    await user.clear(await findEditor());
    await user.click(await findEditor());
    await user.paste("999");
    await user.click(
      screen.getByRole("button", { name: "Close and return to flags" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Unsaved changes");

    await user.click(
      within(dialog).getByRole("button", { name: "Keep editing" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(await findEditor()).toHaveValue("999");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("discards unsaved edits and closes when confirmed", async () => {
    givenFlagRoute("payments:checkout");
    givenApi({ flagValues: { "payments:checkout": { value: "true" } } });
    const { user } = renderWithProviders(<FlagDetailPage />);
    await screen.findByRole("heading", { name: "checkout" });

    await user.clear(await findEditor());
    await user.click(await findEditor());
    await user.paste("999");
    await user.click(
      screen.getByRole("button", { name: "Close and return to flags" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Discard changes" }),
    );

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/flags?prefix=payments:"),
    );
  });
});

describe("flag detail page server updates", () => {
  it("applies server changes while pristine", async () => {
    givenFlagRoute("payments:checkout");
    const state = givenApi({
      flagValues: { "payments:checkout": { value: "true" } },
    });
    renderWithProviders(<FlagDetailPage />);
    expect(await findEditor()).toHaveValue("true");

    state.flagValues["payments:checkout"] = { value: "false" };
    fireEvent(window, new Event("focus"));

    await waitFor(async () => expect(await findEditor()).toHaveValue("false"));
    expect(
      screen.queryByText("This flag changed on the server"),
    ).not.toBeInTheDocument();
  });

  it("warns when the flag changed on the server while dirty", async () => {
    givenFlagRoute("payments:checkout");
    const state = givenApi({
      flagValues: { "payments:checkout": { value: "true" } },
    });
    const { user } = renderWithProviders(<FlagDetailPage />);
    const editor = await findEditor();
    expect(editor).toHaveValue("true");

    await user.clear(editor);
    await user.click(editor);
    await user.paste("999");

    state.flagValues["payments:checkout"] = { value: "false" };
    fireEvent(window, new Event("focus"));

    expect(
      await screen.findByText("This flag changed on the server"),
    ).toBeInTheDocument();
    expect(await findEditor()).toHaveValue("999");
    const newTabButton = screen.getByRole("button", {
      name: "View in new tab",
    });
    expect(newTabButton).toHaveAttribute("href", "/flags/payments%3Acheckout");
    expect(newTabButton).toHaveAttribute("target", "_blank");

    await user.click(screen.getByRole("button", { name: "Load server value" }));

    expect(await findEditor()).toHaveValue("false");
    expect(
      screen.queryByText("This flag changed on the server"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
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
