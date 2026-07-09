import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CopyButton } from "@/components/copy-button";
import { renderWithProviders } from "@/test/render";

describe("CopyButton", () => {
  it("copies the value to the clipboard and toasts on click", async () => {
    const { user } = renderWithProviders(
      <CopyButton value="/api/orders" label="Path" />,
    );

    await user.click(screen.getByRole("button", { name: "Copy path" }));

    expect(await navigator.clipboard.readText()).toBe("/api/orders");
    expect(
      await screen.findByText("Path copied to clipboard."),
    ).toBeInTheDocument();
  });

  it("stays clickable inside a disabled fieldset", async () => {
    const { user } = renderWithProviders(
      <fieldset disabled>
        <CopyButton value="/api/orders" label="Path" />
      </fieldset>,
    );

    await user.click(screen.getByRole("button", { name: "Copy path" }));

    expect(await navigator.clipboard.readText()).toBe("/api/orders");
  });
});
