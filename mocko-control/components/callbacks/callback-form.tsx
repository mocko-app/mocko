"use client";

import Link from "next/link";
import { CircleHelpIcon, XIcon } from "lucide-react";
import { Callout } from "@/components/callout";
import { ConfirmDiscardDialog } from "@/components/confirm-discard-dialog";
import { HeadersEditor } from "@/components/headers-editor";
import { BodyEditor } from "@/components/monaco-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHosts } from "@/lib/frontend/hooks/resources";
import {
  useCallbackForm,
  type CallbackTargetMode,
} from "@/lib/frontend/hooks/use-callback-form";
import { CALLBACK_METHODS } from "@/lib/types/callback";
import type { CallbackDto } from "@/lib/types/callback-dtos";
import { cn } from "@/lib/utils";

type CallbackFormProps = {
  initial?: CallbackDto;
  mode: "create" | "edit";
};

function getFormTitle(mode: CallbackFormProps["mode"], isReadOnly: boolean) {
  if (isReadOnly) {
    return "View callback";
  }
  if (mode === "create") {
    return "Add callback";
  }
  return "Edit callback";
}

function FieldLabel({
  htmlFor,
  label,
  optional,
  help,
}: {
  htmlFor?: string;
  label: string;
  optional?: boolean;
  help?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && (
          <>
            {" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </>
        )}
      </Label>
      {help && (
        <Tooltip>
          <TooltipTrigger
            type="button"
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`${label} field help`}
          >
            <CircleHelpIcon className="size-3.5" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-64">
            {help}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function CallbackForm({ initial, mode }: CallbackFormProps) {
  const isReadOnly = initial?.annotations.includes("READ_ONLY") ?? false;
  const title = getFormTitle(mode, isReadOnly);
  const { data: hosts } = useHosts();
  const {
    confirmDiscard,
    errors,
    form,
    isConfirmingDiscard,
    isSubmitting,
    keepEditing,
    navigateWithGuard,
    set,
    showErrors,
    templateError,
    handleSubmit,
  } = useCallbackForm(initial, mode);

  const hostSlugs = (hosts ?? []).map((host) => host.slug);
  const hasNoHosts = hosts !== undefined && hostSlugs.length === 0;

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
          type="button"
          onClick={() => navigateWithGuard("/callbacks")}
          aria-label="Close and return to callbacks"
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>

      {isReadOnly && (
        <Callout
          variant="info"
          title="Read-only callback"
          message="This callback is defined in a .hcl file and cannot be edited here."
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
            <FieldLabel
              htmlFor="callback-slug"
              label="Slug"
              help="Identifier used to trigger this callback from mocks. Cannot be changed after creation."
            />
            <Input
              id="callback-slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="payment-approved"
              aria-required="true"
              aria-invalid={showErrors && Boolean(errors.slug)}
              autoFocus
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
            <FieldLabel
              label="Slug"
              help="Identifier used to trigger this callback from mocks. Cannot be changed after creation."
            />
            <div
              className="rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm text-muted-foreground select-all"
              aria-label={`Slug: ${initial?.slug ?? ""}`}
            >
              {initial?.slug}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="callback-name" label="Name" optional />
          <Input
            id="callback-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={isReadOnly ? undefined : "Payment approved"}
            readOnly={isReadOnly}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel
            label="Target"
            help="Where the callback request is delivered. Reference a host to reuse its destination per environment, or set an absolute URL."
          />
          <ToggleGroup
            value={[form.targetMode]}
            onValueChange={(values) => {
              if (values.length > 0) {
                set("targetMode", values[0] as CallbackTargetMode);
              }
            }}
            variant="default"
            size="sm"
            className="w-fit"
          >
            <ToggleGroupItem value="host" disabled={isReadOnly}>
              Host
            </ToggleGroupItem>
            <ToggleGroupItem value="url" disabled={isReadOnly}>
              URL
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex w-full gap-3">
          <div className="flex w-28 shrink-0 flex-col gap-1.5">
            <Label htmlFor="callback-method">Method</Label>
            <Select
              value={form.method}
              onValueChange={(v) => set("method", v ?? "POST")}
            >
              <SelectTrigger
                id="callback-method"
                className="w-full"
                aria-label="HTTP method"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALLBACK_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.targetMode === "host" ? (
            <>
              <div className="flex w-44 shrink-0 flex-col gap-1.5">
                <Label htmlFor="callback-host">Host</Label>
                <Select
                  value={form.host}
                  onValueChange={(v) => set("host", v ?? "")}
                >
                  <SelectTrigger
                    id="callback-host"
                    className="w-full"
                    aria-label="Host"
                    aria-invalid={showErrors && Boolean(errors.host)}
                    disabled={hasNoHosts}
                  >
                    <SelectValue>
                      {form.host
                        ? `@${form.host}`
                        : hasNoHosts
                          ? "No hosts yet"
                          : "Select a host"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {hostSlugs.map((slugOption) => (
                      <SelectItem key={slugOption} value={slugOption}>
                        @{slugOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasNoHosts ? (
                  <p className="text-xs text-muted-foreground">
                    <Link
                      href="/hosts/new"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      Add a host
                    </Link>{" "}
                    or target a URL instead.
                  </p>
                ) : showErrors && errors.host ? (
                  <p className="text-xs text-destructive">{errors.host}</p>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="callback-path">Path</Label>
                <Input
                  id="callback-path"
                  value={form.path}
                  onChange={(e) => set("path", e.target.value)}
                  placeholder="/payments/{{payload.id}}/status"
                  aria-required="true"
                  aria-invalid={showErrors && Boolean(errors.path)}
                  className="font-mono text-sm"
                  readOnly={isReadOnly}
                />
                {showErrors && errors.path ? (
                  <p className="text-xs text-destructive">{errors.path}</p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="callback-url">URL</Label>
              <Input
                id="callback-url"
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="http://localhost:9001/callbacks"
                aria-required="true"
                aria-invalid={showErrors && Boolean(errors.url)}
                className="font-mono text-sm"
                readOnly={isReadOnly}
              />
              {showErrors && errors.url ? (
                <p className="text-xs text-destructive">{errors.url}</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel
            htmlFor="callback-delay"
            label="Delay (ms)"
            help="How long after being triggered the callback is delivered. Mocks can override it per trigger."
          />
          <Input
            id="callback-delay"
            type="number"
            min={0}
            value={form.delay}
            onChange={(e) => set("delay", e.target.value)}
            placeholder="0"
            aria-invalid={showErrors && Boolean(errors.delay)}
            className="w-40 font-mono text-sm"
            readOnly={isReadOnly}
          />
          {showErrors && errors.delay ? (
            <p className="text-xs text-destructive">{errors.delay}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel label="Headers" optional />
          <HeadersEditor
            headers={form.headers}
            onChange={(headers) => set("headers", headers)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel
            htmlFor="callback-body"
            label="Body"
            optional
            help="Bigodon template rendered when the callback fires. The trigger's payload is available as payload, data blocks as data."
          />
          <BodyEditor
            value={form.body}
            onChange={(body) => set("body", body)}
            readOnly={isReadOnly}
            parsingError={templateError}
          />
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={() => navigateWithGuard("/callbacks")}
        >
          {isReadOnly ? "Close" : "Cancel"}
        </Button>
        {!isReadOnly && (
          <Button type="submit" disabled={isSubmitting}>
            {mode === "create" ? "Add callback" : "Save"}
          </Button>
        )}
      </div>

      <ConfirmDiscardDialog
        open={isConfirmingDiscard}
        onDiscard={confirmDiscard}
        onKeepEditing={keepEditing}
      />
    </form>
  );
}
