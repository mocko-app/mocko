import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import pkg from "@/package.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface VersionsDto {
  control: string | null;
  core: string | null;
}

export async function GET(): Promise<NextResponse<VersionsDto>> {
  let control: string | null = null;
  try {
    control = pkg.version ?? null;
  } catch {
    control = null;
  }

  const store = getStore();
  const core = await store.getCoreVersion();

  return NextResponse.json({ control, core });
}
