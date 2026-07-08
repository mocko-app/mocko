import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import EditMockPage from "./page";
import { aMockDetails } from "@/test/fixtures";
import { givenApi, givenApiError, server } from "@/test/msw";
import { givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import type { MockDetailsDto, PatchMockDto } from "@/lib/types/mock-dtos";

function givenEditPage(mock: MockDetailsDto) {
  givenRoute({ pathname: `/mocks/${mock.id}`, params: { id: mock.id } });
  return givenApi({ mockDetails: [mock] });
}

function capturePatches(respondWith: MockDetailsDto): PatchMockDto[] {
  const payloads: PatchMockDto[] = [];
  server.use(
    http.patch("/api/mocks/:id", async ({ request }) => {
      payloads.push((await request.json()) as PatchMockDto);
      return HttpResponse.json(respondWith);
    }),
  );
  return payloads;
}

async function findEditForm() {
  return await screen.findByRole("form", { name: "Edit mock" });
}

describe("edit mock page prefill and save", () => {
  it("prefills the form from the mock and saves changes with a PATCH", async () => {
    const mock = aMockDetails({
      id: "mock-src",
      name: "Source mock",
      method: "POST",
      path: "/src",
      format: "xml",
      labels: ["users"],
      response: {
        code: 201,
        delay: 100,
        body: "<a/>",
        headers: {
          "Content-Type": "application/xml",
          "X-Extra": "1",
        },
      },
    });
    givenEditPage(mock);
    const payloads = capturePatches({ ...mock, name: "Renamed mock" });
    const { user } = renderWithProviders(<EditMockPage />);

    await findEditForm();
    expect(screen.getByLabelText("Name")).toHaveValue("Source mock");
    expect(screen.getByLabelText("Path")).toHaveValue("/src");
    expect(screen.getByLabelText("Status code")).toHaveValue(201);
    expect(screen.getByLabelText("HTTP method")).toHaveTextContent("POST");
    expect(
      await screen.findByRole("textbox", { name: "Code editor" }),
    ).toHaveValue("<a/>");

    await user.click(screen.getByText("Advanced options"));
    expect(screen.getByLabelText("Delay (ms)")).toHaveValue(100);
    expect(screen.getByLabelText("Locked header value 1")).toHaveValue(
      "application/xml",
    );
    expect(screen.getByLabelText("Header name 1")).toHaveValue("X-Extra");
    expect(screen.queryByLabelText("Header name 2")).not.toBeInTheDocument();

    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Renamed mock");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Mock updated.")).toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/mocks");
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toEqual({
      format: "xml",
      name: "Renamed mock",
      method: "POST",
      path: "/src",
      host: null,
      labels: ["users"],
      response: {
        code: 201,
        delay: 100,
        body: "<a/>",
        headers: { "X-Extra": "1" },
      },
    });
  });
});

describe("edit mock page read-only mocks", () => {
  it("shows the view-only form with a duplicate escape hatch", async () => {
    const mock = aMockDetails({
      id: "file-mock",
      name: "File mock",
      filePath: "mocks/mock.hcl",
      annotations: ["READ_ONLY"],
    });
    givenEditPage(mock);
    renderWithProviders(<EditMockPage />);

    const form = await screen.findByRole("form", { name: "View Mock" });
    expect(within(form).getByText("Read Only")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("Path")).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Read-only mock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duplicate" })).toHaveAttribute(
      "href",
      "/mocks/new?from=file-mock",
    );
  });
});

describe("edit mock page enable and disable", () => {
  it("enables a disabled mock from the actions menu", async () => {
    const mock = aMockDetails({
      id: "sleepy-mock",
      name: "Sleepy mock",
      isEnabled: false,
    });
    givenEditPage(mock);
    const payloads = capturePatches({ ...mock, isEnabled: true });
    const { user } = renderWithProviders(<EditMockPage />);

    await findEditForm();
    expect(screen.getByText("Disabled")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Actions for Sleepy mock" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Enable" }));

    await waitFor(() => expect(payloads).toEqual([{ isEnabled: true }]));
    await waitFor(() =>
      expect(screen.queryByText("Disabled")).not.toBeInTheDocument(),
    );
  });
});

describe("edit mock page missing and failing mocks", () => {
  it("shows the not-found state for an unknown id", async () => {
    givenRoute({ pathname: "/mocks/missing", params: { id: "missing" } });
    givenApi();
    renderWithProviders(<EditMockPage />);

    expect(await screen.findByText("Mock not found")).toBeInTheDocument();
    expect(
      screen.getByText("This mock does not exist or is no longer available."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to mocks" }),
    ).toHaveAttribute("href", "/mocks");
  });

  it("shows the load-error callout when fetching fails", async () => {
    givenRoute({ pathname: "/mocks/mock-x", params: { id: "mock-x" } });
    givenApi();
    givenApiError("get", "/api/mocks/:id");
    renderWithProviders(<EditMockPage />);

    expect(await screen.findByText("Could not load mock")).toBeInTheDocument();
  });
});

describe("edit mock page delete flow", () => {
  it("always confirms before deleting and then returns to the list", async () => {
    const mock = aMockDetails({ id: "doomed-mock", name: "Doomed mock" });
    givenEditPage(mock);

    const deletedIds: string[] = [];
    server.use(
      http.delete("/api/mocks/:id", ({ params }) => {
        deletedIds.push(String(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<EditMockPage />);
    await findEditForm();

    await user.click(
      screen.getByRole("button", { name: "Actions for Doomed mock" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Delete mock");
    expect(dialog).toHaveTextContent("Doomed mock");
    expect(
      within(dialog).queryByRole("checkbox", {
        name: "Don't ask again this session",
      }),
    ).not.toBeInTheDocument();
    expect(deletedIds).toEqual([]);

    await user.click(
      within(dialog).getByRole("button", {
        name: "Confirm deletion of Doomed mock",
      }),
    );

    await waitFor(() => expect(deletedIds).toEqual(["doomed-mock"]));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/mocks"));
  });
});

function dispatchBeforeUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe("edit mock page unsaved changes guard", () => {
  it("closes without asking when nothing was changed", async () => {
    givenEditPage(aMockDetails({ id: "mock-1", name: "Mock one" }));
    const { user } = renderWithProviders(<EditMockPage />);
    await findEditForm();

    await user.click(
      screen.getByRole("button", { name: "Close and return to mocks" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/mocks");
  });

  it("asks before closing with unsaved edits and keeps them on cancel", async () => {
    givenEditPage(aMockDetails({ id: "mock-1", name: "Mock one" }));
    const { user } = renderWithProviders(<EditMockPage />);
    await findEditForm();

    await user.type(screen.getByLabelText("Name"), "!");
    await user.click(
      screen.getByRole("button", { name: "Close and return to mocks" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Unsaved changes");

    await user.click(
      within(dialog).getByRole("button", { name: "Keep editing" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Mock one!");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("discards unsaved edits and closes when confirmed", async () => {
    givenEditPage(aMockDetails({ id: "mock-1", name: "Mock one" }));
    const { user } = renderWithProviders(<EditMockPage />);
    await findEditForm();

    await user.type(screen.getByLabelText("Name"), "!");
    await user.click(
      screen.getByRole("button", { name: "Close and return to mocks" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Discard changes" }),
    );

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/mocks"));
  });

  it("duplicates immediately when pristine", async () => {
    givenEditPage(aMockDetails({ id: "mock-1", name: "Mock one" }));
    const { user } = renderWithProviders(<EditMockPage />);
    await findEditForm();

    await user.click(
      screen.getByRole("button", { name: "Actions for Mock one" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Duplicate" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/mocks/new?from=mock-1");
  });

  it("asks before duplicating with unsaved edits", async () => {
    givenEditPage(aMockDetails({ id: "mock-1", name: "Mock one" }));
    const { user } = renderWithProviders(<EditMockPage />);
    await findEditForm();

    await user.type(screen.getByLabelText("Name"), "!");
    await user.click(
      screen.getByRole("button", { name: "Actions for Mock one" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Duplicate" }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Discard changes" }),
    );

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/mocks/new?from=mock-1"),
    );
  });

  it("disables save while pristine and re-disables when edits are reverted", async () => {
    givenEditPage(aMockDetails({ id: "mock-1", name: "Mock one" }));
    const { user } = renderWithProviders(<EditMockPage />);
    await findEditForm();

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    await user.type(screen.getByLabelText("Name"), "!");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();

    await user.type(screen.getByLabelText("Name"), "{Backspace}");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Close and return to mocks" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/mocks");
  });

  it("warns before unload only while dirty", async () => {
    givenEditPage(aMockDetails({ id: "mock-1", name: "Mock one" }));
    const { user } = renderWithProviders(<EditMockPage />);
    await findEditForm();

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

    await user.type(screen.getByLabelText("Name"), "!");
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    await user.type(screen.getByLabelText("Name"), "{Backspace}");
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it("stops warning before unload after saved edits while returning to the list", async () => {
    const mock = aMockDetails({ id: "mock-1", name: "Mock one" });
    givenEditPage(mock);
    capturePatches({ ...mock, name: "Mock one!" });

    let resolveListRefresh: () => void = () => {};
    const listRefresh = new Promise<void>((resolve) => {
      resolveListRefresh = resolve;
    });
    let listRequests = 0;
    server.use(
      http.get("/api/mocks", async () => {
        listRequests += 1;
        if (listRequests > 1) {
          await listRefresh;
        }
        return HttpResponse.json([]);
      }),
    );

    const { user } = renderWithProviders(<EditMockPage />);
    await findEditForm();

    await user.type(screen.getByLabelText("Name"), "!");
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Mock updated.")).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

    resolveListRefresh();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/mocks"));
  });
});

describe("edit mock page conflict notice", () => {
  it("shows the shadowed notice linking to the overriding mock", async () => {
    const mock = aMockDetails({
      id: "file-1",
      name: "File mock",
      annotations: ["READ_ONLY", "SHADOWED"],
      conflict: {
        role: "shadowed",
        related: [
          {
            id: "ui-1",
            name: "UI override",
            method: "GET",
            path: "/same",
            host: undefined,
            filePath: undefined,
            source: "UI",
          },
        ],
      },
    });
    givenEditPage(mock);
    renderWithProviders(<EditMockPage />);

    expect(
      await screen.findByText("Shadowed by another mock"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open UI override" }),
    ).toHaveAttribute("href", "/mocks/ui-1");
  });

  it("shows the conflict notice for an ambiguous collision", async () => {
    const mock = aMockDetails({
      id: "ui-a",
      name: "Mock A",
      annotations: ["CONFLICT"],
      conflict: {
        role: "conflict",
        related: [
          {
            id: "ui-b",
            name: "Mock B",
            method: "GET",
            path: "/same",
            host: undefined,
            filePath: undefined,
            source: "UI",
          },
        ],
      },
    });
    givenEditPage(mock);
    renderWithProviders(<EditMockPage />);

    expect(await screen.findByText("Conflicting mocks")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Mock B" })).toHaveAttribute(
      "href",
      "/mocks/ui-b",
    );
  });
});
