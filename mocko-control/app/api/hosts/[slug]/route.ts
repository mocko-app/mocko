import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  HttpResponseError,
  errorResponse,
  jsonResponse,
  noContentResponse,
  tryCatch,
  tryCatchSync,
} from "@/lib/http";
import { hostService } from "@/lib/host/host.service";
import { HostDto } from "@/lib/types/host-dtos";
import { patchHostSchema } from "@/lib/validation/host.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;
  const [host, hostError] = await tryCatch(() => hostService.getHost(slug));
  if (hostError) {
    return errorResponse(hostError);
  }

  return jsonResponse(HostDto.ofHost(host));
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const [payload, parseError] = await tryCatch(() => request.json());
  if (parseError) {
    return errorResponse(
      HttpResponseError.badRequest("Request body must be valid JSON"),
    );
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return errorResponse(
      HttpResponseError.badRequest("Request body must be valid JSON"),
    );
  }

  if ("slug" in payload) {
    return errorResponse(
      HttpResponseError.badRequest('Field "slug" cannot be updated'),
    );
  }

  const [body, bodyError] = tryCatchSync(() => patchHostSchema.parse(payload));
  if (bodyError instanceof ZodError) {
    return errorResponse(HttpResponseError.validationError(bodyError));
  }
  if (bodyError) {
    return errorResponse(bodyError);
  }

  const { slug } = await context.params;
  const [host, updateError] = await tryCatch(() =>
    hostService.updateHost(slug, body),
  );
  if (updateError) {
    return errorResponse(updateError);
  }

  return jsonResponse(HostDto.ofHost(host));
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;
  const [, deleteError] = await tryCatch(() => hostService.deleteHost(slug));
  if (deleteError) {
    return errorResponse(deleteError);
  }

  return noContentResponse();
}
