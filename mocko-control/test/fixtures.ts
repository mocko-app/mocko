import type { FlagKey } from "@/lib/types/flag";
import type { HostDto } from "@/lib/types/host-dtos";
import type { MockDetailsDto, MockDto } from "@/lib/types/mock-dtos";
import type {
  MatchingFlagsOperation,
  StaleFlagsOperation,
  V1MigrationOperation,
  V1PurgeOperation,
} from "@/lib/types/operation";

let mockCounter = 0;
let hostCounter = 0;
let flagCounter = 0;
let operationCounter = 0;

export function aMock(overrides: Partial<MockDto> = {}): MockDto {
  mockCounter += 1;

  return {
    id: `mock-id-${mockCounter}`,
    name: `Mock ${mockCounter}`,
    method: "GET",
    path: `/mock-${mockCounter}`,
    host: undefined,
    filePath: `mocks/mock-${mockCounter}.hcl`,
    format: undefined,
    isEnabled: true,
    labels: [],
    annotations: [],
    ...overrides,
  };
}

export function aMockDetails(
  overrides: Partial<MockDetailsDto> = {},
): MockDetailsDto {
  return {
    ...aMock({ filePath: undefined }),
    response: {
      code: 200,
      delay: undefined,
      body: undefined,
      headers: {},
    },
    failure: null,
    conflict: null,
    ...overrides,
  };
}

export function aHost(overrides: Partial<HostDto> = {}): HostDto {
  hostCounter += 1;

  return {
    slug: `host-${hostCounter}`,
    name: undefined,
    source: `host-${hostCounter}.example.com`,
    destination: undefined,
    annotations: [],
    ...overrides,
  };
}

export function aFlagKey(overrides: Partial<FlagKey> = {}): FlagKey {
  flagCounter += 1;

  return {
    type: "FLAG",
    name: `flag-${flagCounter}`,
    ...overrides,
  };
}

export function aStaleFlagsOperation(
  overrides: Partial<StaleFlagsOperation> = {},
): StaleFlagsOperation {
  operationCounter += 1;

  return {
    id: `operation-${operationCounter}`,
    type: "STALE_FLAGS",
    status: "READY",
    createdAt: new Date().toISOString(),
    staleFlagsData: { thresholdSeconds: 60 * 86_400 },
    ...overrides,
  };
}

export function aMatchingFlagsOperation(
  overrides: Partial<MatchingFlagsOperation> = {},
): MatchingFlagsOperation {
  operationCounter += 1;

  return {
    id: `operation-${operationCounter}`,
    type: "MATCHING_FLAGS",
    status: "READY",
    createdAt: new Date().toISOString(),
    matchingFlagsData: { mode: "PREFIX", pattern: "temp:" },
    ...overrides,
  };
}

export function aV1MigrationOperation(
  overrides: Partial<V1MigrationOperation> = {},
): V1MigrationOperation {
  operationCounter += 1;

  return {
    id: `operation-${operationCounter}`,
    type: "V1_MIGRATION",
    status: "READY",
    createdAt: new Date().toISOString(),
    v1MigrationData: { sourcePrefix: "mocko:", mocksFound: 3, flagsFound: 120 },
    ...overrides,
  };
}

export function aV1PurgeOperation(
  overrides: Partial<V1PurgeOperation> = {},
): V1PurgeOperation {
  operationCounter += 1;

  return {
    id: `operation-${operationCounter}`,
    type: "V1_PURGE",
    status: "READY",
    createdAt: new Date().toISOString(),
    v1PurgeData: {
      sourcePrefix: "mocko:",
      migrationCompletedAt: "2026-07-01T12:00:00.000Z",
      keysFound: 42,
    },
    ...overrides,
  };
}
