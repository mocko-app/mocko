import { route } from "@/lib/http";
import { flagService } from "@/lib/flag/flag.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix") ?? "";
  const search = searchParams.get("q") ?? undefined;

  return flagService.listFlags(prefix, search);
});
