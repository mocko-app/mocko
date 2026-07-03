import { jsonResponse, parseRequestBody, route } from "@/lib/http";
import { computeMockConflicts } from "@/lib/mock/mock-conflicts";
import { mockService } from "@/lib/mock/mock.service";
import { MockDto } from "@/lib/types/mock-dtos";
import { createMockSchema } from "@/lib/validation/mock.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const mocks = await mockService.listMocks();
  const conflicts = computeMockConflicts(mocks);
  return mocks.map((mock) =>
    MockDto.ofMock(mock, conflicts.get(mock.id)?.role),
  );
});

export const POST = route(async (request) => {
  const body = await parseRequestBody(request, createMockSchema);
  const mock = await mockService.createMock(body);
  return jsonResponse(MockDto.ofMock(mock), 201);
});
