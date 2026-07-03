import { jsonResponse, parseRequestBody, route } from "@/lib/http";
import { operationService } from "@/lib/management/operation.service";
import { createOperationSchema } from "@/lib/validation/operation.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  return operationService.listOperations();
});

export const POST = route(async (request) => {
  const body = await parseRequestBody(request, createOperationSchema);
  const operation = await operationService.createOperation(body);
  return jsonResponse(operation, 201);
});
