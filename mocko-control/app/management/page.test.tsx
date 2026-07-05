import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import ManagementPage from "./page";
import {
  aMatchingFlagsOperation,
  aStaleFlagsOperation,
  aV1MigrationOperation,
  aV1PurgeOperation,
} from "@/test/fixtures";
import { givenApi, givenApiError, server } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import type { CreateOperationPayload } from "@/lib/frontend/api";

const SECONDS_PER_DAY = 86_400;

function captureOperationStarts(): CreateOperationPayload[] {
  const payloads: CreateOperationPayload[] = [];
  server.use(
    http.post("/api/operations", async ({ request }) => {
      payloads.push((await request.json()) as CreateOperationPayload);
      return HttpResponse.json(aStaleFlagsOperation({ status: "SCANNING" }), {
        status: 201,
      });
    }),
  );
  return payloads;
}

async function openDialog(user: UserEvent, catalogIndex: number) {
  await screen.findByText("No runs yet. Start an operation above.");
  const startButtons = screen.getAllByRole("button", { name: "Start" });
  await user.click(startButtons[catalogIndex]);
  return await screen.findByRole("dialog");
}

const openStaleFlagsDialog = (user: UserEvent) => openDialog(user, 0);
const openMatchingFlagsDialog = (user: UserEvent) => openDialog(user, 1);

describe("management page stale flags dialog", () => {
  it("converts the day threshold to seconds when starting a scan", async () => {
    givenApi();
    const payloads = captureOperationStarts();
    const { user } = renderWithProviders(<ManagementPage />);

    const dialog = await openStaleFlagsDialog(user);
    expect(within(dialog).getByLabelText("Threshold (days)")).toHaveValue(60);

    await user.click(
      within(dialog).getByRole("button", { name: "Start scan" }),
    );

    await waitFor(() => expect(payloads).toHaveLength(1));
    expect(payloads[0]).toEqual({
      type: "STALE_FLAGS",
      staleFlagsData: { thresholdSeconds: 60 * SECONDS_PER_DAY },
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("disables the start button for blank, zero and fractional thresholds", async () => {
    givenApi();
    const { user } = renderWithProviders(<ManagementPage />);

    const dialog = await openStaleFlagsDialog(user);
    const threshold = within(dialog).getByLabelText("Threshold (days)");
    const start = within(dialog).getByRole("button", { name: "Start scan" });

    await user.clear(threshold);
    expect(start).toBeDisabled();

    await user.type(threshold, "0");
    expect(start).toBeDisabled();

    await user.clear(threshold);
    await user.type(threshold, "1.5");
    expect(start).toBeDisabled();

    await user.clear(threshold);
    await user.type(threshold, "30");
    expect(start).toBeEnabled();
  });

  it("warns when the threshold exceeds the observed Redis age", async () => {
    givenApi({
      operations: {
        operations: [],
        sentinelAgeSeconds: 30 * SECONDS_PER_DAY,
        managementSupported: true,
      },
    });
    const { user } = renderWithProviders(<ManagementPage />);

    const dialog = await openStaleFlagsDialog(user);
    expect(
      within(dialog).getByText("Threshold exceeds Redis age"),
    ).toBeInTheDocument();

    const threshold = within(dialog).getByLabelText("Threshold (days)");
    await user.clear(threshold);
    await user.type(threshold, "10");
    expect(
      within(dialog).queryByText("Threshold exceeds Redis age"),
    ).not.toBeInTheDocument();
  });
});

describe("management page matching flags dialog", () => {
  it("switches placeholder and hint per mode and validates regexes", async () => {
    givenApi();
    const payloads = captureOperationStarts();
    const { user } = renderWithProviders(<ManagementPage />);

    const dialog = await openMatchingFlagsDialog(user);
    const pattern = within(dialog).getByLabelText("Pattern");
    const start = within(dialog).getByRole("button", { name: "Start scan" });

    expect(pattern).toHaveAttribute("placeholder", "payments:");
    expect(
      within(dialog).getByText(
        "Matches flag keys that start with this exact text.",
      ),
    ).toBeInTheDocument();
    expect(start).toBeDisabled();

    await user.click(within(dialog).getByRole("button", { name: "Regex" }));
    expect(pattern).toHaveAttribute("placeholder", "^payments:.*:enabled$");
    expect(
      within(dialog).getByText(
        "Matches flag keys with this regular expression.",
      ),
    ).toBeInTheDocument();

    await user.type(pattern, "[[");
    expect(
      within(dialog).getByText("Invalid regular expression"),
    ).toBeInTheDocument();
    expect(start).toBeDisabled();

    await user.click(within(dialog).getByRole("button", { name: "Contains" }));
    expect(
      within(dialog).queryByText("Invalid regular expression"),
    ).not.toBeInTheDocument();
    expect(start).toBeEnabled();

    await user.click(start);
    await waitFor(() => expect(payloads).toHaveLength(1));
    expect(payloads[0]).toEqual({
      type: "MATCHING_FLAGS",
      matchingFlagsData: { mode: "CONTAINS", pattern: "[" },
    });
  });
});

describe("management page run cards", () => {
  it("purges a ready run with matches only after confirmation", async () => {
    givenApi({
      operations: {
        operations: [
          aMatchingFlagsOperation({
            id: "op-ready",
            matchingFlagsData: {
              mode: "PREFIX",
              pattern: "payments:",
              scannedCount: 100,
              matchedCount: 7,
            },
          }),
        ],
        sentinelAgeSeconds: null,
        managementSupported: true,
      },
    });
    const executed: Array<{ id: string; body: unknown }> = [];
    server.use(
      http.patch("/api/operations/:id", async ({ params, request }) => {
        executed.push({ id: String(params.id), body: await request.json() });
        return HttpResponse.json(
          aMatchingFlagsOperation({ id: "op-ready", status: "EXECUTING" }),
        );
      }),
    );
    const { user } = renderWithProviders(<ManagementPage />);

    const card = await screen.findByRole("listitem");
    expect(card).toHaveTextContent("7 of 100 flags will be purged");
    expect(
      within(card).getByRole("button", { name: "Cancel" }),
    ).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: "Purge" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Purge matching flags");
    expect(dialog).toHaveTextContent("7");
    expect(executed).toHaveLength(0);

    await user.click(
      within(dialog).getByRole("button", { name: /Confirm deletion of/ }),
    );
    await waitFor(() => expect(executed).toHaveLength(1));
    expect(executed[0]).toEqual({
      id: "op-ready",
      body: { status: "EXECUTING" },
    });
  });

  it("offers no purge action when a ready run matched nothing", async () => {
    givenApi({
      operations: {
        operations: [
          aStaleFlagsOperation({
            staleFlagsData: {
              thresholdSeconds: 60 * SECONDS_PER_DAY,
              scannedCount: 50,
              staleFlags: 0,
            },
          }),
        ],
        sentinelAgeSeconds: null,
        managementSupported: true,
      },
    });
    renderWithProviders(<ManagementPage />);

    const card = await screen.findByRole("listitem");
    expect(card).toHaveTextContent("None of 50 flags would be purged");
    expect(card).toHaveTextContent("60-day threshold");
    expect(
      within(card).queryByRole("button", { name: "Purge" }),
    ).not.toBeInTheDocument();
    expect(
      within(card).getByRole("button", { name: "Cancel" }),
    ).toBeInTheDocument();
  });

  it("removes finished and failed runs", async () => {
    givenApi({
      operations: {
        operations: [
          aStaleFlagsOperation({
            id: "op-done",
            status: "DONE",
            completedAt: new Date().toISOString(),
            staleFlagsData: {
              thresholdSeconds: 60 * SECONDS_PER_DAY,
              scannedCount: 50,
              staleFlags: 3,
              purgedCount: 3,
            },
          }),
          aMatchingFlagsOperation({ id: "op-failed", status: "FAILED" }),
        ],
        sentinelAgeSeconds: null,
        managementSupported: true,
      },
    });
    const deletedIds: string[] = [];
    server.use(
      http.delete("/api/operations/:id", ({ params }) => {
        deletedIds.push(String(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderWithProviders(<ManagementPage />);

    const cards = await screen.findAllByRole("listitem");
    expect(cards[0]).toHaveTextContent("3 flags purged");

    await user.click(
      within(cards[0]).getByRole("button", { name: "Remove this run" }),
    );
    await user.click(
      within(cards[1]).getByRole("button", { name: "Remove this run" }),
    );
    await waitFor(() => expect(deletedIds).toEqual(["op-done", "op-failed"]));
  });
});

describe("management page storeless mode", () => {
  it("explains the limitation and disables the catalog", async () => {
    givenApi({
      operations: {
        operations: [],
        sentinelAgeSeconds: null,
        managementSupported: false,
      },
    });
    renderWithProviders(<ManagementPage />);

    expect(
      await screen.findByText("Not available on storeless mode"),
    ).toBeInTheDocument();
    for (const start of screen.getAllByRole("button", { name: "Start" })) {
      expect(start).toBeDisabled();
    }
  });
});

describe("management page failures", () => {
  it("keeps the dialog open and toasts when starting a scan fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    givenApi();
    givenApiError("post", "/api/operations");
    const { user } = renderWithProviders(<ManagementPage />);

    const dialog = await openStaleFlagsDialog(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Start scan" }),
    );

    expect(
      await screen.findByText("Failed to start operation"),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("toasts when the purge cannot be started", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    givenApi({
      operations: {
        operations: [
          aMatchingFlagsOperation({
            matchingFlagsData: {
              mode: "PREFIX",
              pattern: "payments:",
              scannedCount: 10,
              matchedCount: 2,
            },
          }),
        ],
        sentinelAgeSeconds: null,
        managementSupported: true,
      },
    });
    givenApiError("patch", "/api/operations/:id");
    const { user } = renderWithProviders(<ManagementPage />);

    const card = await screen.findByRole("listitem");
    await user.click(within(card).getByRole("button", { name: "Purge" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: /Confirm deletion of/,
      }),
    );

    expect(
      await screen.findByText("Failed to start purge"),
    ).toBeInTheDocument();
  });

  it("toasts when removing a run fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    givenApi({
      operations: {
        operations: [aStaleFlagsOperation({ status: "DONE" })],
        sentinelAgeSeconds: null,
        managementSupported: true,
      },
    });
    givenApiError("delete", "/api/operations/:id");
    const { user } = renderWithProviders(<ManagementPage />);

    await user.click(
      await screen.findByRole("button", { name: "Remove this run" }),
    );

    expect(
      await screen.findByText("Failed to remove operation"),
    ).toBeInTheDocument();
  });
});

describe("management page v1 migration", () => {
  it("hides the migration and purge cards when the feature is off", async () => {
    givenApi();
    renderWithProviders(<ManagementPage />);

    await screen.findByText("No runs yet. Start an operation above.");
    expect(screen.queryByText("Migrate from V1")).not.toBeInTheDocument();
    expect(screen.queryByText("Purge V1 Data")).not.toBeInTheDocument();
  });

  it("shows the migration card when enabled, and the purge card only after a succeeded migration", async () => {
    givenApi({
      operations: {
        operations: [],
        sentinelAgeSeconds: null,
        managementSupported: true,
        v1Migration: { defaultSourcePrefix: "mocko:" },
      },
    });
    renderWithProviders(<ManagementPage />);

    expect(await screen.findByText("Migrate from V1")).toBeInTheDocument();
    expect(screen.queryByText("Purge V1 Data")).not.toBeInTheDocument();
  });

  it("shows the purge card once a migration run has succeeded", async () => {
    givenApi({
      operations: {
        operations: [
          aV1MigrationOperation({
            status: "DONE",
            completedAt: new Date().toISOString(),
          }),
        ],
        sentinelAgeSeconds: null,
        managementSupported: true,
        v1Migration: { defaultSourcePrefix: "mocko:" },
      },
    });
    renderWithProviders(<ManagementPage />);

    expect(await screen.findByText("Purge V1 Data")).toBeInTheDocument();
  });

  it("prefills the source prefix and sends the edited value when starting a migration", async () => {
    givenApi({
      operations: {
        operations: [],
        sentinelAgeSeconds: null,
        managementSupported: true,
        v1Migration: { defaultSourcePrefix: "mocko:" },
      },
    });
    const payloads = captureOperationStarts();
    const { user } = renderWithProviders(<ManagementPage />);

    await screen.findByText("Migrate from V1");
    const startButtons = screen.getAllByRole("button", { name: "Start" });
    await user.click(startButtons[2]);

    const dialog = await screen.findByRole("dialog");
    const prefix = within(dialog).getByLabelText("V1 Redis prefix");
    expect(prefix).toHaveValue("mocko:");

    await user.clear(prefix);
    await user.type(prefix, "my-release:");
    await user.click(
      within(dialog).getByRole("button", { name: "Start scan" }),
    );

    await waitFor(() => expect(payloads).toHaveLength(1));
    expect(payloads[0]).toEqual({
      type: "V1_MIGRATION",
      v1MigrationData: { sourcePrefix: "my-release:" },
    });
  });

  it("starts a purge without a dialog", async () => {
    givenApi({
      operations: {
        operations: [
          aV1MigrationOperation({
            status: "DONE",
            completedAt: new Date().toISOString(),
          }),
        ],
        sentinelAgeSeconds: null,
        managementSupported: true,
        v1Migration: { defaultSourcePrefix: "mocko:" },
      },
    });
    const payloads = captureOperationStarts();
    const { user } = renderWithProviders(<ManagementPage />);

    await screen.findByText("Purge V1 Data");
    const startButtons = screen.getAllByRole("button", { name: "Start" });
    await user.click(startButtons[3]);

    await waitFor(() => expect(payloads).toHaveLength(1));
    expect(payloads[0]).toEqual({ type: "V1_PURGE" });
  });

  it("shows the found counts on a ready migration run and executes without confirmation", async () => {
    givenApi({
      operations: {
        operations: [
          aV1MigrationOperation({
            id: "op-migration",
            v1MigrationData: {
              sourcePrefix: "mocko:",
              mocksFound: 3,
              flagsFound: 120,
            },
          }),
        ],
        sentinelAgeSeconds: null,
        managementSupported: true,
        v1Migration: { defaultSourcePrefix: "mocko:" },
      },
    });
    const executed: string[] = [];
    server.use(
      http.patch("/api/operations/:id", ({ params }) => {
        executed.push(String(params.id));
        return HttpResponse.json(
          aV1MigrationOperation({ id: "op-migration", status: "EXECUTING" }),
        );
      }),
    );
    const { user } = renderWithProviders(<ManagementPage />);

    const card = await screen.findByRole("listitem");
    expect(card).toHaveTextContent("3 mocks and 120 flags will be migrated");

    await user.click(within(card).getByRole("button", { name: "Migrate" }));
    await waitFor(() => expect(executed).toEqual(["op-migration"]));
  });

  it("offers only cancel when the migration scan found nothing", async () => {
    givenApi({
      operations: {
        operations: [
          aV1MigrationOperation({
            v1MigrationData: {
              sourcePrefix: "wrong:",
              mocksFound: 0,
              flagsFound: 0,
            },
          }),
        ],
        sentinelAgeSeconds: null,
        managementSupported: true,
        v1Migration: { defaultSourcePrefix: "mocko:" },
      },
    });
    renderWithProviders(<ManagementPage />);

    const card = await screen.findByRole("listitem");
    expect(card).toHaveTextContent(
      "No V1 mocks or flags found, check the source prefix",
    );
    expect(
      within(card).queryByRole("button", { name: "Migrate" }),
    ).not.toBeInTheDocument();
    expect(
      within(card).getByRole("button", { name: "Cancel" }),
    ).toBeInTheDocument();
  });

  it("confirms a v1 purge with the migration date warning", async () => {
    givenApi({
      operations: {
        operations: [
          aV1PurgeOperation({
            id: "op-purge",
            v1PurgeData: {
              sourcePrefix: "mocko:",
              migrationCompletedAt: "2026-07-01T12:00:00.000Z",
              keysFound: 42,
            },
          }),
        ],
        sentinelAgeSeconds: null,
        managementSupported: true,
        v1Migration: { defaultSourcePrefix: "mocko:" },
      },
    });
    const executed: string[] = [];
    server.use(
      http.patch("/api/operations/:id", ({ params }) => {
        executed.push(String(params.id));
        return HttpResponse.json(
          aV1PurgeOperation({ id: "op-purge", status: "EXECUTING" }),
        );
      }),
    );
    const { user } = renderWithProviders(<ManagementPage />);

    const card = await screen.findByRole("listitem");
    expect(card).toHaveTextContent("42 V1 keys will be deleted");

    await user.click(within(card).getByRole("button", { name: "Purge" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Purge V1 data");
    expect(dialog).toHaveTextContent(
      "Flags written by V1 after that date will be lost",
    );
    expect(dialog).toHaveTextContent("make sure Mocko V1 is decommissioned");
    expect(executed).toHaveLength(0);

    await user.click(
      within(dialog).getByRole("button", { name: /Confirm deletion of/ }),
    );
    await waitFor(() => expect(executed).toEqual(["op-purge"]));
  });
});
