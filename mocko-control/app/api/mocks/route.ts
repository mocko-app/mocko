import { NextResponse } from "next/server";
import {
  errorResponse,
  jsonResponse,
  parseRequestBody,
  tryCatch,
} from "@/lib/http";
import { mockService } from "@/lib/mock/mock.service";
import { MockDto } from "@/lib/types/dto";
import { createMockSchema } from "@/lib/validation/mock.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const mocks = await mockService.listMocks();
  return jsonResponse(mocks.map(MockDto.ofMock));
}

export async function POST(request: Request): Promise<NextResponse> {
  const [body, bodyError] = await tryCatch(() =>
    parseRequestBody(request, createMockSchema),
  );
  if (bodyError) {
    return errorResponse(bodyError);
  }

  const [mock, createError] = await tryCatch(() =>
    mockService.createMock(body),
  );
  if (createError) {
    return errorResponse(createError);
  }

  return jsonResponse(MockDto.ofMock(mock), 201);
}
