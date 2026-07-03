import { parseRequestBody, route } from "@/lib/http";
import { operationService } from "@/lib/management/operation.service";
import { patchOperationSchema } from "@/lib/validation/operation.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const PATCH = route(async (request, context: RouteContext) => {
  await parseRequestBody(request, patchOperationSchema);

  const { id } = await context.params;
  return operationService.transitionToExecuting(id);
});

export const DELETE = route(async (_request, context: RouteContext) => {
  const { id } = await context.params;
  await operationService.deleteOperation(id);
});
