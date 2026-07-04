import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { BottomTabBar } from "./bottom-tab-bar";
import { givenRoute } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";

describe("bottom tab bar navigation", () => {
  it("links to bare list URLs so navigating resets any active filters", () => {
    givenRoute({ pathname: "/mocks", search: "q=create&label=users" });
    renderWithProviders(<BottomTabBar />);

    expect(screen.getByRole("link", { name: "Mocks" })).toHaveAttribute(
      "href",
      "/mocks",
    );
    expect(screen.getByRole("link", { name: "Flags" })).toHaveAttribute(
      "href",
      "/flags",
    );
  });
});
