import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import HostDetailPage from "./page";
import { aHost, aHostDetails } from "@/test/fixtures";
import { givenApi, server } from "@/test/msw";
import { givenRoute, router } from "@/test/navigation";
import { renderWithProviders } from "@/test/render";
import type { PatchHostDto } from "@/lib/types/host-dtos";

const patchedIds: string[] = [];

function capturePatches(): PatchHostDto[] {
  patchedIds.length = 0;
  const payloads: PatchHostDto[] = [];
  server.use(
    http.patch("/api/hosts/:id", async ({ params, request }) => {
      patchedIds.push(String(params.id));
      payloads.push((await request.json()) as PatchHostDto);
      return HttpResponse.json(aHostDetails());
    }),
  );
  return payloads;
}

function givenEditableHost() {
  givenRoute({ pathname: "/hosts/payments-id", params: { id: "payments-id" } });
  givenApi({
    hosts: [
      aHost({
        id: "payments-id",
        slug: "payments",
        name: "Payments",
        source: "payments.local",
        destination: "http://localhost:9001",
      }),
    ],
  });
}

describe("host detail page", () => {
  it("shows the slug statically and clears the destination with null", async () => {
    givenEditableHost();
    const payloads = capturePatches();
    const { user } = renderWithProviders(<HostDetailPage />);

    await screen.findByRole("form", { name: "Edit host" });
    expect(screen.getByLabelText("Slug: payments")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Slug" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Destination (optional)")).toHaveValue(
      "http://localhost:9001",
    );

    await user.clear(screen.getByLabelText("Destination (optional)"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Host updated.")).toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/hosts");
    expect(payloads).toHaveLength(1);
    expect(patchedIds).toEqual(["payments-id"]);
    expect(payloads[0]).toEqual({
      name: "Payments",
      source: "payments.local",
      destination: null,
    });
    expect(payloads[0].destination).toBeNull();
  });

  it("closes without asking when nothing was changed", async () => {
    givenEditableHost();
    const { user } = renderWithProviders(<HostDetailPage />);
    await screen.findByRole("form", { name: "Edit host" });

    await user.click(
      screen.getByRole("button", { name: "Close and return to hosts" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/hosts");
  });

  it("asks before closing with unsaved edits and keeps them on cancel", async () => {
    givenEditableHost();
    const { user } = renderWithProviders(<HostDetailPage />);
    await screen.findByRole("form", { name: "Edit host" });

    await user.type(screen.getByLabelText("Name (optional)"), " service");
    await user.click(
      screen.getByRole("button", { name: "Close and return to hosts" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Unsaved changes");

    await user.click(
      within(dialog).getByRole("button", { name: "Keep editing" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Name (optional)")).toHaveValue(
      "Payments service",
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("discards unsaved edits from cancel when confirmed", async () => {
    givenEditableHost();
    const { user } = renderWithProviders(<HostDetailPage />);
    await screen.findByRole("form", { name: "Edit host" });

    await user.type(screen.getByLabelText("Name (optional)"), " service");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Discard changes" }),
    );

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/hosts"));
  });

  it("renders a read-only host without a save button", async () => {
    givenRoute({ pathname: "/hosts/legacy-id", params: { id: "legacy-id" } });
    givenApi({
      hosts: [
        aHost({
          id: "legacy-id",
          slug: "legacy",
          source: "legacy.local",
          annotations: ["READ_ONLY"],
        }),
      ],
    });
    const { user } = renderWithProviders(<HostDetailPage />);

    await screen.findByRole("form", { name: "View host" });
    expect(screen.getByText("Read-only host")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name (optional)")).toBeDisabled();
    expect(screen.getByLabelText("Source")).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith("/hosts");
  });

  it("shows the not-found callout for a missing host", async () => {
    givenRoute({ pathname: "/hosts/gone", params: { id: "gone" } });
    givenApi();
    renderWithProviders(<HostDetailPage />);

    expect(await screen.findByText("Host not found")).toBeInTheDocument();
  });

  it("shows the source file of a file host", async () => {
    givenRoute({ pathname: "/hosts/file-id", params: { id: "file-id" } });
    givenApi({
      hostDetails: [
        aHostDetails({
          id: "file-id",
          slug: "files",
          filePath: "hosts/files.hcl",
          annotations: ["READ_ONLY"],
        }),
      ],
    });
    renderWithProviders(<HostDetailPage />);

    await screen.findByRole("form", { name: "View host" });
    expect(screen.getByLabelText("Source file")).toHaveValue("hosts/files.hcl");
  });
});

async function findNotice(title: string): Promise<HTMLElement> {
  const heading = await screen.findByText(title);
  const notice = heading.closest<HTMLElement>('[role="alert"]');
  if (!notice) {
    throw new Error(`No notice titled "${title}"`);
  }
  return notice;
}

describe("host detail conflict notice", () => {
  const uiHost = aHost({ id: "ui-id", slug: "shared", annotations: [] });
  const fileHost = aHost({
    id: "file-id",
    slug: "Shared",
    filePath: "hosts/shared.hcl",
    annotations: ["READ_ONLY"],
  });
  const otherFileHost = aHost({
    id: "other-file-id",
    slug: "shared",
    filePath: "hosts/other.hcl",
    annotations: ["READ_ONLY"],
  });

  it("explains that a file host is shadowed and links to the ui host", async () => {
    givenRoute({ pathname: "/hosts/file-id", params: { id: "file-id" } });
    givenApi({
      hostDetails: [
        aHostDetails({
          ...fileHost,
          annotations: ["READ_ONLY", "SHADOWED"],
          conflict: {
            role: "shadowed",
            related: [
              {
                id: "ui-id",
                slug: "shared",
                source: uiHost.source,
                origin: "UI",
              },
            ],
          },
        }),
      ],
    });
    renderWithProviders(<HostDetailPage />);

    const notice = await findNotice("Shadowed by another host");
    expect(notice).toHaveTextContent("this file host is ignored");
    expect(
      within(notice).getByRole("link", { name: "Open UI host shared" }),
    ).toHaveAttribute("href", "/hosts/ui-id");
    expect(screen.getByText("Shadowed")).toBeInTheDocument();
  });

  it("tells the ui host which file host it shadows", async () => {
    givenRoute({ pathname: "/hosts/ui-id", params: { id: "ui-id" } });
    givenApi({
      hostDetails: [
        aHostDetails({
          ...uiHost,
          conflict: {
            role: "active",
            related: [
              {
                id: "file-id",
                slug: "Shared",
                source: fileHost.source,
                filePath: "hosts/shared.hcl",
                origin: "FILE",
              },
            ],
          },
        }),
      ],
    });
    renderWithProviders(<HostDetailPage />);

    const notice = await findNotice("Shadowing a file host");
    expect(notice).toHaveTextContent("hosts/shared.hcl");
    expect(
      within(notice).getByRole("link", { name: "Open file host Shared" }),
    ).toHaveAttribute("href", "/hosts/file-id");
    expect(screen.queryByText("Shadowed")).not.toBeInTheDocument();
    expect(screen.queryByText("Conflict")).not.toBeInTheDocument();
  });

  it("warns about a conflict and links to every other host with the slug", async () => {
    givenRoute({ pathname: "/hosts/file-id", params: { id: "file-id" } });
    givenApi({
      hostDetails: [
        aHostDetails({
          ...fileHost,
          annotations: ["READ_ONLY", "CONFLICT"],
          conflict: {
            role: "conflict",
            related: [
              {
                id: "ui-id",
                slug: "shared",
                source: uiHost.source,
                origin: "UI",
              },
              {
                id: "other-file-id",
                slug: "shared",
                source: otherFileHost.source,
                filePath: "hosts/other.hcl",
                origin: "FILE",
              },
            ],
          },
        }),
      ],
    });
    renderWithProviders(<HostDetailPage />);

    const notice = await findNotice("Conflicting hosts");
    expect(
      within(notice).getByRole("link", { name: "Open UI host shared" }),
    ).toHaveAttribute("href", "/hosts/ui-id");
    expect(
      within(notice).getByRole("link", { name: "Open file host shared" }),
    ).toHaveAttribute("href", "/hosts/other-file-id");
    expect(screen.getByText("Conflict")).toBeInTheDocument();
  });

  it("shows no notice for a host without conflicts", async () => {
    givenEditableHost();
    renderWithProviders(<HostDetailPage />);

    await screen.findByRole("form", { name: "Edit host" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
