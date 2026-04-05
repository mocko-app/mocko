import { NextResponse } from "next/server";
import {
  errorResponse,
  jsonResponse,
  noContentResponse,
  parseRequestBody,
  tryCatch,
} from "@/lib/http";
import { flagService } from "@/lib/flag/flag.service";
import { putFlagSchema } from "@/lib/validation/flag.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { key: rawKey } = await context.params;
  const key = decodeURIComponent(rawKey);
  const [flag, getError] = await tryCatch(() => flagService.getFlag(key));
  if (getError) {
    return errorResponse(getError);
  }

  return jsonResponse(flag);
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const [body, bodyError] = await tryCatch(() =>
    parseRequestBody(request, putFlagSchema),
  );
  if (bodyError) {
    return errorResponse(bodyError);
  }

  const { key: rawKey } = await context.params;
  const key = decodeURIComponent(rawKey);
  const [flag, putError] = await tryCatch(() => flagService.setFlag(key, body));
  if (putError) {
    return errorResponse(putError);
  }

  return jsonResponse(flag);
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { key: rawKey } = await context.params;
  const key = decodeURIComponent(rawKey);
  const [, deleteError] = await tryCatch(() => flagService.deleteFlag(key));
  if (deleteError) {
    return errorResponse(deleteError);
  }

  return noContentResponse();
}
