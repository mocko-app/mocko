"use client";

import Link from "next/link";
import { CircleHelpIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHosts } from "@/lib/frontend/hooks/resources";
import type { HostDto } from "@/lib/types/host-dtos";

const ANY_HOST_VALUE = "__any_host__";

function getHostLabel(host?: HostDto): string {
  if (!host) {
    return "Any host";
  }

  return host.name ? `${host.slug} (${host.name})` : host.slug;
}

function getSelectedHostLabel(
  hostSlug: string,
  hostOptions: HostDto[],
): string {
  if (!hostSlug) {
    return "Any host";
  }

  const host = hostOptions.find((option) => option.slug === hostSlug);
  return host ? getHostLabel(host) : hostSlug;
}

type MockFormHostFieldProps = {
  hostSlug: string;
  isReadOnly?: boolean;
  isSubmitting?: boolean;
  onHostSlugChange: (hostSlug: string) => void;
};

export function MockFormHostField({
  hostSlug,
  isReadOnly = false,
  isSubmitting = false,
  onHostSlugChange,
}: MockFormHostFieldProps) {
  const { data: hostOptions = [] } = useHosts({
    refreshInterval: 0,
  });
  const matchedHost = hostOptions.find((option) => option.slug === hostSlug);
  const isReadOnlyRawHost = isReadOnly && Boolean(hostSlug) && !matchedHost;
  const label = (
    <div className="flex items-center gap-1.5">
      <Label htmlFor="mock-host">Host</Label>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Host field help"
        >
          <CircleHelpIcon className="size-3.5" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-56">
          Only respond to requests with this host.
        </TooltipContent>
      </Tooltip>
    </div>
  );

  if (isReadOnlyRawHost) {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <Input id="mock-host" value={hostSlug} readOnly />
        <p className="text-xs text-muted-foreground">
          This mock matches the raw Host header instead of a defined host slug.
        </p>
      </div>
    );
  }

  if (hostOptions.length === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <p className="text-xs text-muted-foreground">
          No hosts defined.{" "}
          <Link
            href="/hosts"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Create one on the Hosts page
          </Link>{" "}
          to scope mocks to a specific Host header.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label}
      <Select
        value={hostSlug || ANY_HOST_VALUE}
        disabled={isReadOnly || isSubmitting}
        onValueChange={(value) =>
          onHostSlugChange(value === ANY_HOST_VALUE ? "" : (value ?? ""))
        }
      >
        <SelectTrigger id="mock-host" className="w-48" aria-label="Host">
          <SelectValue>
            {getSelectedHostLabel(hostSlug, hostOptions)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY_HOST_VALUE}>Any host</SelectItem>
          {hostOptions.map((host) => (
            <SelectItem key={host.slug} value={host.slug}>
              {getHostLabel(host)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
