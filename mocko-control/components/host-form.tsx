"use client";

import Link from "next/link";
import { CircleHelpIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Callout } from "@/components/callout";
import { useHostForm } from "@/lib/frontend/hooks/use-host-form";
import type { HostDto } from "@/lib/types/host-dtos";
import { cn } from "@/lib/utils";

type HostFormProps = {
  initial?: HostDto;
  mode: "create" | "edit";
};

function getFormTitle(mode: HostFormProps["mode"], isReadOnly: boolean) {
  if (isReadOnly) {
    return "View host";
  }
  if (mode === "create") {
    return "Add host";
  }
  return "Edit host";
}

export function HostForm({ initial, mode }: HostFormProps) {
  const isReadOnly = initial?.annotations.includes("READ_ONLY") ?? false;
  const title = getFormTitle(mode, isReadOnly);
  const { errors, form, isSubmitting, set, showErrors, handleSubmit } =
    useHostForm(initial, mode);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => handleSubmit(event, isReadOnly)}
      aria-label={title}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{title}</h1>
          {isReadOnly && (
            <Badge variant="annotationReadOnly" className="text-xs">
              Read Only
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          nativeButton={false}
          render={<Link href="/hosts" aria-label="Close and return to hosts" />}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>

      {isReadOnly && (
        <Callout
          variant="info"
          title="Read-only host"
          message="This host is defined in a .hcl file and cannot be edited here."
        />
      )}

      {showErrors && errors.form && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2"
          role="alert"
          aria-live="polite"
        >
          <p className="text-xs text-destructive">{errors.form}</p>
        </div>
      )}

      <fieldset
        className="flex flex-col gap-4"
        disabled={isReadOnly || isSubmitting}
      >
        {mode === "create" ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="host-slug">Slug</Label>
              <Tooltip>
                <TooltipTrigger
                  render={<button type="button" />}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Slug field help"
                >
                  <CircleHelpIcon className="size-3.5" aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-64">
                  Short identifier used in logs and mock definitions. Cannot be
                  changed after creation.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="host-slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="payments"
              aria-required="true"
              aria-invalid={showErrors && Boolean(errors.slug)}
              className={cn(
                "font-mono text-sm",
                showErrors &&
                  errors.slug &&
                  "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
              )}
            />
            {showErrors && errors.slug ? (
              <p className="text-xs text-destructive">{errors.slug}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label>Slug</Label>
              <Tooltip>
                <TooltipTrigger
                  render={<button type="button" />}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Slug field help"
                >
                  <CircleHelpIcon className="size-3.5" aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-56">
                  Short identifier used in logs and mock definitions. Cannot be
                  changed after creation.
                </TooltipContent>
              </Tooltip>
            </div>
            <div
              className="rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm text-muted-foreground select-all"
              aria-label={`Slug: ${initial?.slug ?? ""}`}
            >
              {initial?.slug}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="host-name">
            Name{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            id="host-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Payments service"
            readOnly={isReadOnly}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="host-source">Source</Label>
            <Tooltip>
              <TooltipTrigger
                render={<button type="button" />}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Source field help"
              >
                <CircleHelpIcon className="size-3.5" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-56">
                The Host header value that routes requests to this host.
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="host-source"
            value={form.source}
            onChange={(e) => set("source", e.target.value)}
            placeholder="payments.local"
            aria-required="true"
            className="font-mono text-sm"
            readOnly={isReadOnly}
          />
          {showErrors && errors.source ? (
            <p className="text-xs text-destructive">{errors.source}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="host-destination">Destination</Label>
            <Tooltip>
              <TooltipTrigger
                render={<button type="button" />}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Destination field help"
              >
                <CircleHelpIcon className="size-3.5" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-56">
                Upstream URL that matched requests are proxied to.
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="host-destination"
            value={form.destination}
            onChange={(e) => set("destination", e.target.value)}
            placeholder="http://localhost:9001"
            aria-required="true"
            className="font-mono text-sm"
            readOnly={isReadOnly}
          />
          {showErrors && errors.destination ? (
            <p className="text-xs text-destructive">{errors.destination}</p>
          ) : null}
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/hosts" />}
        >
          {isReadOnly ? "Close" : "Cancel"}
        </Button>
        {!isReadOnly && (
          <Button type="submit" disabled={isSubmitting}>
            {mode === "create" ? "Add host" : "Save"}
          </Button>
        )}
      </div>
    </form>
  );
}
