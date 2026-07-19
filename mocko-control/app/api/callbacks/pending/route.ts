import { route } from "@/lib/http";
import { callbackService } from "@/lib/callback/callback.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  return await callbackService.listPending();
});

export const DELETE = route(async () => {
  await callbackService.clearPending();
});
