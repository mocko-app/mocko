export type OperationStatus =
  | "SCANNING"
  | "READY"
  | "EXECUTING"
  | "DONE"
  | "FAILED";

export type OperationType = "STALE_FLAGS" | "MATCHING_FLAGS";

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

export type StaleFlagsOperation = OperationBase & {
  type: "STALE_FLAGS";
  staleFlagsData: StaleFlagsData;
};

export type MatchingFlagsOperation = OperationBase & {
  type: "MATCHING_FLAGS";
  matchingFlagsData: MatchingFlagsData;
};

export type Operation = StaleFlagsOperation | MatchingFlagsOperation;

export type OperationUpdate = Partial<OperationBase> & {
  staleFlagsData?: Partial<StaleFlagsData>;
  matchingFlagsData?: Partial<MatchingFlagsData>;
};

export type OperationsResponse = {
  operations: Operation[];
  sentinelAgeSeconds: number | null;
  managementSupported: boolean;
};
