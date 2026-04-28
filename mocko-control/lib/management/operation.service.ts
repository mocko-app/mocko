import { randomUUID } from "node:crypto";
import { HttpResponseError } from "@/lib/http";
import { getStore } from "@/lib/store";
import { StoreNotSupportedError } from "@/lib/store/store-errors";
import type { Store } from "@/lib/store/store";
import type { Operation, OperationsResponse } from "@/lib/types/operation";
import type { CreateOperationInput } from "@/lib/validation/operation.schema";

export class OperationService {
  constructor(private readonly store: Store) {}

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
    };
  }

  async createOperation(input: CreateOperationInput): Promise<Operation> {
    this.assertManagementSupported();

    const operation: Operation = {
      id: randomUUID(),
      type: "STALE_FLAGS",
      status: "SCANNING",
      createdAt: new Date().toISOString(),
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

    await this.store.updateOperation(id, { status: "EXECUTING" });
    this.runBackground(id, () => this.store.purgeStaleFlagsForManagement(id));

    return { ...operation, status: "EXECUTING" };
  }

  async deleteOperation(id: string): Promise<void> {
    this.assertManagementSupported();

    await this.store.deleteOperation(id);
  }

  private assertManagementSupported(): void {
    if (!this.store.isManagementSupported) {
      throw HttpResponseError.unprocessableEntity(
        "Management operations require Redis mode",
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

export const operationService = new OperationService(getStore());
