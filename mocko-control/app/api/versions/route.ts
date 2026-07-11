import { NextResponse } from "next/server";
import { getStoreConfig } from "@/lib/config/store-config";
import { getStore } from "@/lib/store";
import pkg from "@/package.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MOCK_BASE_URL = "http://localhost:8080";

export interface VersionsDto {
  control: string | null;
  core: string | null;
  mockBaseUrl: string;
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

  const config = getStoreConfig();
  const mockBaseUrl =
    config.publicUrl || config.coreUrl || DEFAULT_MOCK_BASE_URL;

  return NextResponse.json({ control, core, mockBaseUrl });
}
