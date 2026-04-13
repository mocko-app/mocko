"use client";

import Link from "next/link";
import { XIcon } from "lucide-react";
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
import { Callout } from "@/components/callout";
import { MockFormAdvancedOptions } from "@/components/mock-form-advanced-options";
import { BodyEditor } from "@/components/monaco-editor";
import {
  CONTENT_TYPES,
  type ContentType,
  useMockForm,
} from "@/lib/frontend/hooks/use-mock-form";
import { getAvailableLabels } from "@/lib/utils/labels";
import { LabelPicker } from "@/components/label-picker";
import type { CreateMockDto, MockDetailsDto } from "@/lib/types/mock-dtos";
import { HTTP_METHODS } from "@/lib/types/mock";
import { cn } from "@/lib/utils";

type MockFormProps = {
  initial?: MockDetailsDto;
  mode: "create" | "edit";
};

function getFormTitle(mode: MockFormProps["mode"], isReadOnly: boolean) {
  if (isReadOnly) {
    return "View Mock";
  }
  if (mode === "create") {
    return "Create mock";
  }
  return "Edit mock";
}

const MockFormHeader: React.FC<{
  title: string;
  isReadOnly: boolean;
}> = ({ title, isReadOnly }) => {
  return (
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
        render={<Link href="/mocks" aria-label="Close and return to mocks" />}
      >
        <XIcon aria-hidden="true" />
      </Button>
    </div>
  );
};

export function MockForm({ initial, mode }: MockFormProps) {
  const isReadOnly = initial?.annotations.includes("READ_ONLY") ?? false;
  const isTemporary = initial?.annotations.includes("TEMPORARY") ?? false;
  const title = getFormTitle(mode, isReadOnly);
  const submitLabel = mode === "create" ? "Create" : "Save changes";
  const {
    activeContentType,
    errors,
    form,
    handleSubmit,
    isSubmitting,
    lockedHeader,
    mocksData,
    set,
    showErrors,
    templateError,
  } = useMockForm(initial, mode);
  const availableLabels = getAvailableLabels(mocksData ?? []);
  const hasNestPathParams = /\/:[A-Za-z0-9_-]+/.test(form.path);
  const bodyError = templateError;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit}
      aria-label={title}
    >
      <MockFormHeader isReadOnly={isReadOnly} title={title} />
      {isReadOnly && (
        <Callout
          variant="info"
          title="Read-only mock"
          message="This mock was loaded from a file. To edit it, update the mock file and let Mocko reload it."
        />
      )}
      {isTemporary && (
        <Callout
          variant="info"
          title="Temporary mock"
          message="This mock was created through the UI without a persistent store. It will be lost when Mocko restarts."
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mock-name">Name</Label>
          <Input
            id="mock-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Get user profile"
            aria-required="true"
            aria-invalid={showErrors && Boolean(errors.name)}
            readOnly={isReadOnly}
          />
          {showErrors && errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Labels</Label>
          <LabelPicker
            value={form.labels}
            onChange={(labels) => set("labels", labels)}
            availableLabels={availableLabels}
            readOnly={isReadOnly}
          />
        </div>

        {initial?.filePath && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mock-source-file">Source file</Label>
            <Input id="mock-source-file" value={initial.filePath} readOnly />
          </div>
        )}

        <div className="flex w-full gap-3">
          <div className="flex w-28 shrink-0 flex-col gap-1.5">
            <Label htmlFor="mock-method">Method</Label>
            <Select
              value={form.method}
              onValueChange={(v) => set("method", v as CreateMockDto["method"])}
            >
              <SelectTrigger
                id="mock-method"
                className="w-full"
                aria-label="HTTP method"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="mock-path">Path</Label>
            <Input
              id="mock-path"
              value={form.path}
              onChange={(e) => set("path", e.target.value)}
              placeholder="/users/{id}"
              aria-required="true"
              aria-invalid={showErrors && Boolean(errors.path)}
              readOnly={isReadOnly}
              className={cn(
                "font-mono text-sm",
                !errors.path &&
                  hasNestPathParams &&
                  "border-amber-500/60 focus-visible:border-amber-500 focus-visible:ring-amber-500/20",
              )}
            />
            {showErrors && errors.path && (
              <p className="text-xs text-destructive">{errors.path}</p>
            )}
            {!errors.path && hasNestPathParams && (
              <p className="text-xs text-amber-400">
                Path parameters use {"{param}"} syntax, not :param.
              </p>
            )}
          </div>
        </div>

        <div className="flex w-36 flex-col gap-1.5">
          <Label htmlFor="mock-status">Status code</Label>
          <Input
            id="mock-status"
            type="number"
            value={form.statusCode}
            onChange={(e) => set("statusCode", e.target.value)}
            placeholder="200"
            min={200}
            max={599}
            aria-required="true"
            aria-invalid={showErrors && Boolean(errors.statusCode)}
            readOnly={isReadOnly}
          />
          {showErrors && errors.statusCode && (
            <p className="text-xs text-destructive">{errors.statusCode}</p>
          )}
        </div>

        <MockFormAdvancedOptions
          headers={form.headers}
          hostSlug={form.hostSlug}
          lockedHeaders={lockedHeader}
          onHeadersChange={(headers) => set("headers", headers)}
          onHostSlugChange={(hostSlug) => set("hostSlug", hostSlug)}
        />

        <div className="flex w-full flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label>Response body</Label>
            <ToggleGroup
              value={[form.contentType]}
              onValueChange={(values) => {
                if (values.length > 0) {
                  set("contentType", values[0] as ContentType);
                }
              }}
              variant="default"
              size="sm"
            >
              {CONTENT_TYPES.map((ct) => (
                <ToggleGroupItem key={ct.id} value={ct.id}>
                  {ct.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {bodyError && (
            <Callout
              title="There is an issue with your template"
              message={bodyError.message}
            />
          )}
          {initial?.failure && (
            <Callout
              title="Last runtime failure"
              message={initial.failure.message}
            />
          )}
          <BodyEditor
            value={form.body}
            onChange={(v) => set("body", v)}
            readOnly={isReadOnly}
            language={activeContentType.monacoLanguage}
            parsingError={bodyError}
          />
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/mocks" />}
        >
          Cancel
        </Button>
        {!isReadOnly && (
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
