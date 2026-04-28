import { NextResponse } from "next/server";
import {
  errorResponse,
  jsonResponse,
  noContentResponse,
  parseRequestBody,
  tryCatch,
} from "@/lib/http";
import { operationService } from "@/lib/management/operation.service";
import { patchOperationSchema } from "@/lib/validation/operation.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const [body, bodyError] = await tryCatch(() =>
    parseRequestBody(request, patchOperationSchema),
  );
  if (bodyError) {
    return errorResponse(bodyError);
  }

  const { id } = await context.params;
  const [operation, patchError] = await tryCatch(() =>
    operationService.transitionToExecuting(id),
  );
  if (patchError) {
    return errorResponse(patchError);
  }

  void body;
  return jsonResponse(operation);
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  const [, deleteError] = await tryCatch(() =>
    operationService.deleteOperation(id),
  );
  if (deleteError) {
    return errorResponse(deleteError);
  }

  return noContentResponse();
}
