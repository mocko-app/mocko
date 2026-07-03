import { NextResponse } from "next/server";
import {
  errorResponse,
  HttpResponseError,
  jsonResponse,
  noContentResponse,
  parseRequestBody,
  tryCatch,
} from "@/lib/http";
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

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;

  const [mocks, listError] = await tryCatch(() => mockService.listMocks());
  if (listError) {
    return errorResponse(listError);
  }

  const mock = mocks.find((item) => item.id === id);
  if (!mock) {
    return errorResponse(HttpResponseError.mockNotFound(id));
  }

  const [failure] = await tryCatch(() => mockService.getFailure(id));
  const conflicts = computeMockConflicts(mocks);
  const conflict = resolveMockConflict(id, conflicts, mocks);
  return jsonResponse(MockDetailsDto.ofMock(mock, failure ?? null, conflict));
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const [body, bodyError] = await tryCatch(() =>
    parseRequestBody(request, patchMockSchema),
  );
  if (bodyError) {
    return errorResponse(bodyError);
  }

  const { id } = await context.params;
  const [mock, updateError] = await tryCatch(() =>
    mockService.updateMock(id, body),
  );
  if (updateError) {
    return errorResponse(updateError);
  }

  const [mocks] = await tryCatch(() => mockService.listMocks());
  const conflict = mocks
    ? resolveMockConflict(id, computeMockConflicts(mocks), mocks)
    : null;
  return jsonResponse(MockDetailsDto.ofMock(mock, null, conflict));
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  const [, deleteError] = await tryCatch(() => mockService.deleteMock(id));
  if (deleteError) {
    return errorResponse(deleteError);
  }

  return noContentResponse();
}
