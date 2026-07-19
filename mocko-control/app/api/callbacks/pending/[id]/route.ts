import { route } from "@/lib/http";
import { callbackService } from "@/lib/callback/callback.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const DELETE = route(async (_request, context: RouteContext) => {
  const { id } = await context.params;
  await callbackService.cancelPending(id);
});
