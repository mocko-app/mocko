import { NextResponse } from "next/server";
import { noContentResponse, tryCatch } from "@/lib/http";
import { mockService } from "@/lib/mock/mock.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const [, healthError] = await tryCatch(() => mockService.health());
  if (healthError) {
    return noContentResponse(503);
  }

  return noContentResponse(200);
}
