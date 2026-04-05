"use client";

import Link from "next/link";
import { FlagForm } from "@/components/flags/flag-form";
import { Button } from "@/components/ui/button";
import { useParam } from "@/lib/frontend/hooks/use-param";

function FlagMissingState() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-lg font-semibold text-foreground">Flag not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This flag does not exist or has expired.
      </p>
      <div className="mt-4 flex justify-center">
        <Button nativeButton={false} render={<Link href="/flags" />}>
          Back to flags
        </Button>
      </div>
    </div>
  );
}

export default function FlagDetailPage() {
  const rawKey = useParam("key");
  const key = rawKey ? decodeURIComponent(rawKey) : undefined;

  if (!key) {
    return <FlagMissingState />;
  }

  return <FlagForm mode="view" flagKey={key} />;
}
