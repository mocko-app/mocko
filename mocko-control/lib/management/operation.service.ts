import { randomUUID } from "node:crypto";
import { getStoreConfig, type StoreConfig } from "@/lib/config/store-config";
import { HttpResponseError } from "@/lib/http";
import { getStore } from "@/lib/store";
import { StoreNotSupportedError } from "@/lib/store/store-errors";
import type { Store } from "@/lib/store/store";
import type {
  Operation,
  OperationsResponse,
  V1MigrationOperation,
} from "@/lib/types/operation";
import type { CreateOperationInput } from "@/lib/validation/operation.schema";

export class OperationService {
  constructor(
    private readonly store: Store,
    private readonly config: StoreConfig,
  ) {}

  async listOperations(): Promise<OperationsResponse> {
    if (!this.store.isManagementSupported) {
      return {
        operations: [],
        sentinelAgeSeconds: null,
        managementSupported: false,
      };
    }

    const [operations, sentinelAgeSeconds] = await Promise.all([
      this.store.listOperations(),
      this.store.getSentinelIdleSeconds(),
    ]);

    let visibleSentinelAgeSeconds = sentinelAgeSeconds;
    if (visibleSentinelAgeSeconds !== null && visibleSentinelAgeSeconds < 1) {
      visibleSentinelAgeSeconds = null;
    }

    return {
      operations,
      sentinelAgeSeconds: visibleSentinelAgeSeconds,
      managementSupported: true,
      ...(this.config.v1MigrationEnabled
        ? { v1Migration: { defaultSourcePrefix: this.defaultSourcePrefix() } }
        : {}),
    };
  }

  async createOperation(input: CreateOperationInput): Promise<Operation> {
    this.assertManagementSupported();

    const baseOperation = {
      id: randomUUID(),
      status: "SCANNING" as const,
      createdAt: new Date().toISOString(),
    };

    switch (input.type) {
      case "STALE_FLAGS": {
        const operation: Operation = {
          ...baseOperation,
          type: "STALE_FLAGS",
          staleFlagsData: {
            thresholdSeconds: input.staleFlagsData.thresholdSeconds,
            scannedCount: 0,
          },
        };
        await this.store.createOperation(operation);
        this.runBackground(operation.id, () =>
          this.store.scanStaleFlagsForManagement(
            operation.id,
            input.staleFlagsData.thresholdSeconds,
          ),
        );
        return operation;
      }
      case "MATCHING_FLAGS": {
        const operation: Operation = {
          ...baseOperation,
          type: "MATCHING_FLAGS",
          matchingFlagsData: {
            mode: input.matchingFlagsData.mode,
            pattern: input.matchingFlagsData.pattern,
            scannedCount: 0,
          },
        };
        await this.store.createOperation(operation);
        this.runBackground(operation.id, () =>
          this.store.scanMatchingFlagsForManagement(
            operation.id,
            input.matchingFlagsData.mode,
            input.matchingFlagsData.pattern,
          ),
        );
        return operation;
      }
      case "V1_MIGRATION": {
        this.assertV1MigrationEnabled();
        const sourcePrefix = normalizeSourcePrefix(
          input.v1MigrationData.sourcePrefix,
        );
        const operation: Operation = {
          ...baseOperation,
          type: "V1_MIGRATION",
          v1MigrationData: { sourcePrefix },
        };
        await this.store.createOperation(operation);
        this.runBackground(operation.id, () =>
          this.store.scanV1MigrationForManagement(operation.id, sourcePrefix),
        );
        return operation;
      }
      case "V1_PURGE": {
        this.assertV1MigrationEnabled();
        const migration = await this.findLatestDoneMigration();
        if (!migration) {
          throw HttpResponseError.badRequest(
            "V1 purge requires a completed V1 migration run",
          );
        }

        const operation: Operation = {
          ...baseOperation,
          type: "V1_PURGE",
          v1PurgeData: {
            sourcePrefix: migration.v1MigrationData.sourcePrefix,
            migrationCompletedAt: migration.completedAt,
          },
        };
        await this.store.createOperation(operation);
        this.runBackground(operation.id, () =>
          this.store.scanV1PurgeForManagement(
            operation.id,
            operation.v1PurgeData.sourcePrefix,
          ),
        );
        return operation;
      }
    }
  }

  async transitionToExecuting(id: string): Promise<Operation> {
    this.assertManagementSupported();

    const operation = await this.store.getOperation(id);
    if (!operation) {
      throw HttpResponseError.operationNotFound(id);
    }
    if (operation.status !== "READY") {
      throw HttpResponseError.badRequest(
        "Only READY operations can transition to EXECUTING",
      );
    }
    if (operation.type === "V1_MIGRATION" && (await this.store.hasOwnMocks())) {
      throw HttpResponseError.badRequest(
        "V1 migration requires an empty workspace, but this workspace already has mocks",
      );
    }

    await this.store.updateOperation(id, { status: "EXECUTING" });
    this.runBackground(id, () => this.executeOperation(operation));

    return { ...operation, status: "EXECUTING" };
  }

  async deleteOperation(id: string): Promise<void> {
    this.assertManagementSupported();

    await this.store.deleteOperation(id);
  }

  private executeOperation(operation: Operation): Promise<void> {
    switch (operation.type) {
      case "V1_MIGRATION":
        return this.store.executeV1MigrationForManagement(
          operation.id,
          operation.v1MigrationData.sourcePrefix,
        );
      case "V1_PURGE":
        return this.store.executeV1PurgeForManagement(
          operation.id,
          operation.v1PurgeData.sourcePrefix,
        );
      default:
        return this.store.purgeStaleFlagsForManagement(operation.id);
    }
  }

  private async findLatestDoneMigration(): Promise<V1MigrationOperation | null> {
    const operations = await this.store.listOperations();
    return (
      operations.find(
        (operation): operation is V1MigrationOperation =>
          operation.type === "V1_MIGRATION" && operation.status === "DONE",
      ) ?? null
    );
  }

  private defaultSourcePrefix(): string {
    const prefix = this.config.redisPrefix;
    return prefix.endsWith("v2:") ? prefix.slice(0, -"v2:".length) : prefix;
  }

  private assertManagementSupported(): void {
    if (!this.store.isManagementSupported) {
      throw HttpResponseError.unprocessableEntity(
        "Management operations require Redis mode",
      );
    }
  }

  private assertV1MigrationEnabled(): void {
    if (!this.config.v1MigrationEnabled) {
      throw HttpResponseError.unprocessableEntity(
        "V1 migration is not enabled",
      );
    }
  }

  private runBackground(
    operationId: string,
    callback: () => Promise<void>,
  ): void {
    void callback().catch(async (error) => {
      console.error(`Management operation ${operationId} failed:`, error);
      try {
        await this.store.updateOperation(operationId, {
          status: "FAILED",
          completedAt: new Date().toISOString(),
        });
      } catch (updateError) {
        if (!(updateError instanceof StoreNotSupportedError)) {
          console.error(
            `Failed to mark operation ${operationId} as FAILED:`,
            updateError,
          );
        }
      }
    });
  }
}

function normalizeSourcePrefix(prefix: string): string {
  return prefix.endsWith(":") ? prefix : `${prefix}:`;
}

export const operationService = new OperationService(
  getStore(),
  getStoreConfig(),
);
