export type OperationStatus =
  | "SCANNING"
  | "READY"
  | "EXECUTING"
  | "DONE"
  | "FAILED";

export type OperationType = "STALE_FLAGS";

export type OperationBase = {
  id: string;
  type: OperationType;
  status: OperationStatus;
  createdAt: string;
  completedAt?: string;
};

export type StaleFlagsData = {
  thresholdSeconds: number;
  scannedCount?: number;
  staleFlags?: number;
  purgedCount?: number;
};

export type Operation = OperationBase & {
  type: "STALE_FLAGS";
  staleFlagsData: StaleFlagsData;
};

export type OperationUpdate = Partial<OperationBase> & {
  staleFlagsData?: Partial<StaleFlagsData>;
};

export type OperationsResponse = {
  operations: Operation[];
  sentinelAgeSeconds: number | null;
  managementSupported: boolean;
};
