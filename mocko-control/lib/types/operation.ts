export type OperationStatus =
  | "SCANNING"
  | "READY"
  | "EXECUTING"
  | "DONE"
  | "FAILED";

export type OperationType =
  | "STALE_FLAGS"
  | "MATCHING_FLAGS"
  | "V1_MIGRATION"
  | "V1_PURGE";

export type MatchingFlagsMode = "PREFIX" | "CONTAINS" | "REGEX";

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

export type MatchingFlagsData = {
  mode: MatchingFlagsMode;
  pattern: string;
  scannedCount?: number;
  matchedCount?: number;
  purgedCount?: number;
};

export type V1MigrationData = {
  sourcePrefix: string;
  mocksFound?: number;
  flagsFound?: number;
  mocksMigrated?: number;
  flagsMigrated?: number;
  flagsSkipped?: number;
};

export type V1PurgeData = {
  sourcePrefix: string;
  migrationCompletedAt?: string;
  keysFound?: number;
  purgedCount?: number;
};

export type StaleFlagsOperation = OperationBase & {
  type: "STALE_FLAGS";
  staleFlagsData: StaleFlagsData;
};

export type MatchingFlagsOperation = OperationBase & {
  type: "MATCHING_FLAGS";
  matchingFlagsData: MatchingFlagsData;
};

export type V1MigrationOperation = OperationBase & {
  type: "V1_MIGRATION";
  v1MigrationData: V1MigrationData;
};

export type V1PurgeOperation = OperationBase & {
  type: "V1_PURGE";
  v1PurgeData: V1PurgeData;
};

export type Operation =
  | StaleFlagsOperation
  | MatchingFlagsOperation
  | V1MigrationOperation
  | V1PurgeOperation;

export type OperationUpdate = Partial<OperationBase> & {
  staleFlagsData?: Partial<StaleFlagsData>;
  matchingFlagsData?: Partial<MatchingFlagsData>;
  v1MigrationData?: Partial<V1MigrationData>;
  v1PurgeData?: Partial<V1PurgeData>;
};

export type OperationsResponse = {
  operations: Operation[];
  sentinelAgeSeconds: number | null;
  managementSupported: boolean;
  v1Migration?: {
    defaultSourcePrefix: string;
  };
};
