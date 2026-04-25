import { NextResponse } from "next/server";
import {
  errorResponse,
  jsonResponse,
  parseRequestBody,
  tryCatch,
} from "@/lib/http";
import { operationService } from "@/lib/management/operation.service";
import { createOperationSchema } from "@/lib/validation/operation.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const [response, listError] = await tryCatch(() =>
    operationService.listOperations(),
  );
  if (listError) {
    return errorResponse(listError);
  }

  return jsonResponse(response);
}

export async function POST(request: Request): Promise<NextResponse> {
  const [body, bodyError] = await tryCatch(() =>
    parseRequestBody(request, createOperationSchema),
  );
  if (bodyError) {
    return errorResponse(bodyError);
  }

  const [operation, createError] = await tryCatch(() =>
    operationService.createOperation(body),
  );
  if (createError) {
    return errorResponse(createError);
  }

  return jsonResponse(operation, 201);
}
