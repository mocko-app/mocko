import { NextResponse } from "next/server";
import { errorResponse, jsonResponse, tryCatch } from "@/lib/http";
import { flagService } from "@/lib/flag/flag.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix") ?? "";
  const search = searchParams.get("q") ?? undefined;

  const [list, listError] = await tryCatch(() =>
    flagService.listFlags(prefix, search),
  );
  if (listError) {
    return errorResponse(listError);
  }

  return jsonResponse(list);
}
