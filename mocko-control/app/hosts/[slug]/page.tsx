"use client";

import { Callout } from "@/components/callout";
import { HostForm } from "@/components/host-form";
import { ApiError } from "@/lib/frontend/api";
import { useHost } from "@/lib/frontend/hooks/resources";
import { useParam } from "@/lib/frontend/hooks/use-param";

export default function HostDetailPage() {
  const slug = useParam("slug");
  const { data: host, error, isLoading } = useHost(slug);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading host...</div>;
  }

  if (error instanceof ApiError && error.code === "HOST_NOT_FOUND") {
    return (
      <Callout
        title="Host not found"
        message="This host no longer exists or is unavailable."
      />
    );
  }

  if (error || !host) {
    return (
      <Callout
        title="Could not load host"
        message="Refresh the page or restart Mocko."
      />
    );
  }

  return <HostForm initial={host} mode="edit" />;
}
