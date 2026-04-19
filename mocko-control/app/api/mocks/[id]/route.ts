import { NextResponse } from "next/server";
import {
  errorResponse,
  jsonResponse,
  noContentResponse,
  parseRequestBody,
  tryCatch,
} from "@/lib/http";
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
  const [mock, mockError] = await tryCatch(() => mockService.getMock(id));
  if (mockError) {
    return errorResponse(mockError);
  }

  const [failure] = await tryCatch(() => mockService.getFailure(id));
  return jsonResponse(MockDetailsDto.ofMock(mock, failure));
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

  return jsonResponse(MockDetailsDto.ofMock(mock));
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
