import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Sidebar } from "./sidebar";
import { server } from "@/test/msw";
import { givenRoute } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";

describe("sidebar navigation", () => {
  it("links to bare list URLs so navigating resets any active filters", async () => {
    givenRoute({ pathname: "/mocks", search: "q=create&label=users" });
    server.use(
      http.get("/api/versions", () =>
        HttpResponse.json({ control: "1.0.0", core: "1.0.0" }),
      ),
    );
    renderWithProviders(<Sidebar />);

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
