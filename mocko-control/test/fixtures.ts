import type { MockDto } from "@/lib/types/mock-dtos";

let mockCounter = 0;

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
