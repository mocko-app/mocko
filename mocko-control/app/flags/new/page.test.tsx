import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import NewFlagPage from "./page";
import { givenApi, server } from "@/test/msw";
import { givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import type { PutFlagDto } from "@/lib/types/flag-dtos";

function capturePuts(): Array<{ key: string; payload: PutFlagDto }> {
  const puts: Array<{ key: string; payload: PutFlagDto }> = [];
  server.use(
    http.put("/api/flags/:key", async ({ params, request }) => {
      puts.push({
        key: decodeURIComponent(String(params.key)),
        payload: (await request.json()) as PutFlagDto,
      });
      return HttpResponse.json({ value: "" });
    }),
  );
  return puts;
}

describe("new flag page", () => {
  it("prefills the key from the prefix and creates the flag", async () => {
    givenRoute({ pathname: "/flags/new", search: "prefix=payments:" });
    givenApi();
    const puts = capturePuts();
    const { user } = renderWithProviders(<NewFlagPage />);

    const keyInput = screen.getByLabelText("Key");
    expect(keyInput).toHaveValue("payments:");

    await user.type(keyInput, "new-flag");
    const editor = await screen.findByRole("textbox", { name: "Code editor" });
    await user.click(editor);
    await user.paste('"on"');
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        `/flags/${encodeURIComponent("payments:new-flag")}`,
      ),
    );
    expect(puts).toEqual([
      {
        key: "payments:new-flag",
        payload: { value: '"on"', source: "CONTROL" },
      },
    ]);
  });

  it("rejects malformed keys inline and sends nothing", async () => {
    givenApi();
    const puts = capturePuts();
    const { user } = renderWithProviders(<NewFlagPage />);
    const keyInput = screen.getByLabelText("Key");

    for (const invalid of [":a", "a:", "a::b"]) {
      await user.clear(keyInput);
      await user.type(keyInput, invalid);
      await user.click(screen.getByRole("button", { name: "Create" }));
      expect(
        await screen.findByText(
          "Flag key cannot start or end with ':' or contain empty sections like '::'",
        ),
      ).toBeInTheDocument();
    }

    await user.clear(keyInput);
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Flag key is required")).toBeInTheDocument();

    expect(puts).toHaveLength(0);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("surfaces the API message when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    givenApi();
    server.use(
      http.put("/api/flags/:key", () =>
        HttpResponse.json({ message: "Redis unavailable" }, { status: 500 }),
      ),
    );
    const { user } = renderWithProviders(<NewFlagPage />);

    await user.type(screen.getByLabelText("Key"), "my-flag");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Redis unavailable")).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});
