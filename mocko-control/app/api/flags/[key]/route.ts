import { NextResponse } from "next/server";
import {
  errorResponse,
  jsonResponse,
  noContentResponse,
  parseRequestBody,
  tryCatch,
} from "@/lib/http";
import { getFlagService } from "@/lib/flag/flag.service";
import { patchFlagSchema } from "@/lib/validation/flag.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    key: string;
  }>;
};

const flagService = getFlagService();

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

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const [body, bodyError] = await tryCatch(() =>
    parseRequestBody(request, patchFlagSchema),
  );
  if (bodyError) {
    return errorResponse(bodyError);
  }

  const { key: rawKey } = await context.params;
  const key = decodeURIComponent(rawKey);
  const [flag, patchError] = await tryCatch(() =>
    flagService.updateFlag(key, body),
  );
  if (patchError) {
    return errorResponse(patchError);
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
