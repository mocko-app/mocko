import { parseRequestBody, route, tryCatch } from "@/lib/http";
import {
  computeMockConflicts,
  resolveMockConflict,
} from "@/lib/mock/mock-conflicts";
import { mockService } from "@/lib/mock/mock.service";
import { MockDetailsDto } from "@/lib/types/mock-dtos";
import { patchMockSchema } from "@/lib/validation/mock.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = route(async (_request, context: RouteContext) => {
  const { id } = await context.params;

  const mocks = await mockService.listMocks();
  const mock = await mockService.getMock(id);

  const [failure] = await tryCatch(() => mockService.getFailure(id));
  const conflicts = computeMockConflicts(mocks);
  const conflict = resolveMockConflict(id, conflicts, mocks);
  return MockDetailsDto.ofMock(mock, failure ?? null, conflict);
});

export const PATCH = route(async (request, context: RouteContext) => {
  const body = await parseRequestBody(request, patchMockSchema);

  const { id } = await context.params;
  const mock = await mockService.updateMock(id, body);

  const [mocks] = await tryCatch(() => mockService.listMocks());
  const conflict = mocks
    ? resolveMockConflict(id, computeMockConflicts(mocks), mocks)
    : null;
  return MockDetailsDto.ofMock(mock, null, conflict);
});

export const DELETE = route(async (_request, context: RouteContext) => {
  const { id } = await context.params;
  await mockService.deleteMock(id);
});
