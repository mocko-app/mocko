import { NextResponse } from "next/server";
import {
  errorResponse,
  jsonResponse,
  parseRequestBody,
  tryCatch,
} from "@/lib/http";
import { getFlagService } from "@/lib/flag/flag.service";
import { createFlagSchema } from "@/lib/validation/flag.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const flagService = getFlagService();

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix") ?? "";

  const [list, listError] = await tryCatch(() => flagService.listFlags(prefix));
  if (listError) {
    return errorResponse(listError);
  }

  return jsonResponse(list);
}

export async function POST(request: Request): Promise<NextResponse> {
  const [body, bodyError] = await tryCatch(() =>
    parseRequestBody(request, createFlagSchema),
  );
  if (bodyError) {
    return errorResponse(bodyError);
  }

  const [flag, createError] = await tryCatch(() =>
    flagService.createFlag(body),
  );
  if (createError) {
    return errorResponse(createError);
  }

  return jsonResponse(flag, 201);
}
