import { NextResponse } from "next/server";
import {
  errorResponse,
  jsonResponse,
  parseRequestBody,
  tryCatch,
} from "@/lib/http";
import { hostService } from "@/lib/host/host.service";
import { HostDto } from "@/lib/types/host-dtos";
import { createHostSchema } from "@/lib/validation/host.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const [hosts, listError] = await tryCatch(() => hostService.listHosts());
  if (listError) {
    return errorResponse(listError);
  }

  return jsonResponse(hosts.map(HostDto.ofHost));
}

export async function POST(request: Request): Promise<NextResponse> {
  const [body, bodyError] = await tryCatch(() =>
    parseRequestBody(request, createHostSchema),
  );
  if (bodyError) {
    return errorResponse(bodyError);
  }

  const [host, createError] = await tryCatch(() =>
    hostService.createHost(body),
  );
  if (createError) {
    return errorResponse(createError);
  }

  return jsonResponse(HostDto.ofHost(host), 201);
}
