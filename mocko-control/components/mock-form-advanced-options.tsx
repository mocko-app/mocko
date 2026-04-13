"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, CircleHelpIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { HeadersEditor } from "@/components/headers-editor";
import { useHosts } from "@/lib/frontend/hooks/resources";
import type { HostDto } from "@/lib/types/host-dtos";
import { cn } from "@/lib/utils";

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

type MockFormAdvancedOptionsProps = {
  headers: { key: string; value: string }[];
  hostSlug: string;
  lockedHeaders: { key: string; value: string }[];
  onHeadersChange: (headers: { key: string; value: string }[]) => void;
  onHostSlugChange: (hostSlug: string) => void;
};

export function MockFormAdvancedOptions({
  headers,
  hostSlug,
  lockedHeaders,
  onHeadersChange,
  onHostSlugChange,
}: MockFormAdvancedOptionsProps) {
  const { data: hostOptions = [] } = useHosts({
    refreshInterval: 0,
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <Collapsible
      open={advancedOpen}
      onOpenChange={setAdvancedOpen}
      className="flex flex-col gap-2"
    >
      <CollapsibleTrigger className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground">
        <ChevronDownIcon
          className={cn(
            "size-4 transition-transform",
            advancedOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
        Advanced options
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 flex flex-col gap-4">
        <div className="flex w-full flex-col gap-1.5">
          <Label>Response headers</Label>
          <HeadersEditor
            headers={headers}
            onChange={onHeadersChange}
            lockedHeaders={lockedHeaders}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="mock-host">Host</Label>
            <Tooltip>
              <TooltipTrigger
                render={<button type="button" />}
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
          {hostOptions.length === 0 ? (
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
          ) : (
            <Select
              value={hostSlug || ANY_HOST_VALUE}
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
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
