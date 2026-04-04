"use client";

import { useState } from "react";
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
import { HeadersEditor } from "@/components/headers-editor";
import { BodyEditor } from "@/components/monaco-editor";
import { HTTP_METHODS } from "@/lib/types/mock";
import type { Mock } from "@/lib/types/mock";
import { cn } from "@/lib/utils";

type MockFormProps = {
  initial?: Mock;
  mode: "create" | "edit";
};

type FormState = {
  name: string;
  method: Mock["method"];
  path: string;
  statusCode: string;
  headers: { key: string; value: string }[];
  body: string;
};

type FormErrors = {
  name?: string;
  path?: string;
  statusCode?: string;
};

const RESERVED_PREFIX = "/__mocko__";

function headersToRows(headers: Record<string, string>) {
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

function getFormTitle(mode: MockFormProps["mode"], isReadOnly: boolean) {
  if (isReadOnly) {
    return "View Mock";
  }
  if (mode === "create") {
    return "Create mock";
  }
  return "Edit mock";
}

function getFormErrors(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > 255) {
    errors.name = "Name must be at most 255 characters.";
  }

  const path = form.path.trim();
  if (!path) {
    errors.path = "Path is required.";
  } else {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (
      normalizedPath === RESERVED_PREFIX ||
      normalizedPath.startsWith(`${RESERVED_PREFIX}/`)
    ) {
      errors.path = 'Path cannot start with "/__mocko__/".';
    }
  }

  const statusCode = form.statusCode.trim();
  if (!statusCode) {
    errors.statusCode = "Status code is required.";
  } else {
    const parsed = Number(statusCode);
    if (Number.isNaN(parsed)) {
      errors.statusCode = "Response code must be a number.";
    } else if (!Number.isInteger(parsed)) {
      errors.statusCode = "Response code must be an integer.";
    } else if (parsed < 200) {
      errors.statusCode = "Response code must be at least 200.";
    } else if (parsed > 599) {
      errors.statusCode = "Response code must be at most 599.";
    }
  }

  return errors;
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
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? "",
    method: initial?.method ?? "GET",
    path: initial?.path ?? "",
    statusCode: String(initial?.response.code ?? "200"),
    headers: initial ? headersToRows(initial.response.headers) : [],
    body: initial?.response.body ?? "",
  });
  const [hideErrors, setHideErrors] = useState(true);

  const isReadOnly = initial?.annotations.includes("READ_ONLY") ?? false;
  const title = getFormTitle(mode, isReadOnly);
  const submitLabel = mode === "create" ? "Create" : "Save changes";
  const hasNestPathParams = /\/:[A-Za-z0-9_-]+/.test(form.path);
  const errors = getFormErrors(form);
  const hasErrors = Boolean(errors.name || errors.path || errors.statusCode);
  const showErrors = !hideErrors;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHideErrors(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (hasErrors) {
      setHideErrors(false);
      return;
    }
  }

  return (
    <form
      className="flex flex-col gap-6 max-w-2xl mx-auto px-8 pt-8 pb-8"
      onSubmit={handleSubmit}
      aria-label={title}
    >
      <MockFormHeader isReadOnly={isReadOnly} title={title} />
      <fieldset className="flex flex-col gap-4" disabled={isReadOnly}>
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

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 w-36">
            <Label htmlFor="mock-method">Method</Label>
            <Select
              value={form.method}
              onValueChange={(v) => set("method", v as Mock["method"])}
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

          <div className="flex flex-col gap-1.5 flex-1">
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

        <div className="flex flex-col gap-1.5 w-36">
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

        <div className="flex flex-col gap-1.5">
          <Label>Response headers</Label>
          <HeadersEditor
            headers={form.headers}
            onChange={(h) => set("headers", h)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mock-body">Response body</Label>
          <BodyEditor
            value={form.body}
            onChange={(v) => set("body", v)}
            readOnly={isReadOnly}
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
        {!isReadOnly && <Button type="submit">{submitLabel}</Button>}
      </div>
    </form>
  );
}
