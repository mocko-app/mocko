"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { HeadersEditor } from "@/components/headers-editor";
import { BodyEditor } from "@/components/monaco-editor";
import {
  ApiError,
  createMock,
  patchMock,
  toFormValidationErrors,
} from "@/lib/frontend/api";
import { useMocks } from "@/lib/frontend/hooks/resources";
import type {
  CreateMockDto,
  MockDetailsDto,
  ParsingError,
} from "@/lib/types/dto";
import { HTTP_METHODS } from "@/lib/types/mock";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = [
  {
    id: "json",
    label: "JSON",
    contentTypeHeader: "application/json",
    monacoLanguage: "json",
  },
  {
    id: "xml",
    label: "XML",
    contentTypeHeader: "application/xml",
    monacoLanguage: "xml",
  },
  {
    id: "html",
    label: "HTML",
    contentTypeHeader: "text/html",
    monacoLanguage: "html",
  },
  {
    id: "plaintext",
    label: "Plain Text",
    contentTypeHeader: "text/plain",
    monacoLanguage: "plaintext",
  },
  {
    id: "other",
    label: "Other",
    contentTypeHeader: null,
    monacoLanguage: "plaintext",
  },
] as const;

type ContentType = (typeof CONTENT_TYPES)[number]["id"];

type MockFormProps = {
  initial?: MockDetailsDto;
  mode: "create" | "edit";
};

type FormState = {
  name: string;
  method: CreateMockDto["method"];
  path: string;
  statusCode: string;
  headers: { key: string; value: string }[];
  body: string;
  contentType: ContentType;
};

type FormErrors = {
  form?: string;
  name?: string;
  path?: string;
  statusCode?: string;
};

const RESERVED_PREFIX = "/__mocko__";

function headersToRows(headers: Record<string, string>) {
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

function rowsToHeaders(rows: Array<{ key: string; value: string }>) {
  const headers: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) {
      continue;
    }
    headers[key] = row.value;
  }
  return headers;
}

function deriveInitialContentType(headers: Record<string, string>): {
  contentType: ContentType;
  filteredHeaders: { key: string; value: string }[];
} {
  const entry = Object.entries(headers).find(
    ([k]) => k.toLowerCase() === "content-type",
  );
  const filteredHeaders = headersToRows(
    Object.fromEntries(
      Object.entries(headers).filter(
        ([k]) => k.toLowerCase() !== "content-type",
      ),
    ),
  );

  if (!entry) {
    return { contentType: "other", filteredHeaders };
  }

  const match = CONTENT_TYPES.find(
    (c) =>
      c.contentTypeHeader &&
      entry[1].toLowerCase() === c.contentTypeHeader.toLowerCase(),
  );
  if (match) {
    return { contentType: match.id, filteredHeaders };
  }

  return {
    contentType: "other",
    filteredHeaders: [{ key: entry[0], value: entry[1] }, ...filteredHeaders],
  };
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
  const router = useRouter();
  const { mutate } = useMocks();
  const [form, setForm] = useState<FormState>(() => {
    if (!initial) {
      return {
        name: "",
        method: "GET",
        path: "",
        statusCode: "200",
        headers: [],
        body: "",
        contentType: "json",
      };
    }
    const { contentType, filteredHeaders } = deriveInitialContentType(
      initial.response.headers,
    );
    return {
      name: initial.name,
      method: initial.method,
      path: initial.path,
      statusCode: String(initial.response.code),
      headers: filteredHeaders,
      body: initial.response.body ?? "",
      contentType,
    };
  });
  const [hideErrors, setHideErrors] = useState(true);
  const [serverErrors, setServerErrors] = useState<FormErrors>({});
  const [templateError, setTemplateError] = useState<ParsingError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReadOnly = initial?.annotations.includes("READ_ONLY") ?? false;
  const title = getFormTitle(mode, isReadOnly);
  const submitLabel = mode === "create" ? "Create" : "Save changes";
  const hasNestPathParams = /\/:[A-Za-z0-9_-]+/.test(form.path);
  const localErrors = getFormErrors(form);
  const errors: FormErrors = {
    form: serverErrors.form,
    name: localErrors.name ?? serverErrors.name,
    path: localErrors.path ?? serverErrors.path,
    statusCode: localErrors.statusCode ?? serverErrors.statusCode,
  };
  const hasErrors = Boolean(errors.name || errors.path || errors.statusCode);
  const showErrors = !hideErrors;

  const activeContentType = CONTENT_TYPES.find(
    (c) => c.id === form.contentType,
  )!;
  const lockedHeader = activeContentType.contentTypeHeader
    ? [{ key: "Content-Type", value: activeContentType.contentTypeHeader }]
    : [];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHideErrors(true);
    setServerErrors({});
    setTemplateError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (hasErrors) {
      setHideErrors(false);
      return;
    }

    const statusCode = Number(form.statusCode.trim());
    const payload = {
      name: form.name.trim(),
      method: form.method,
      path: form.path.trim(),
      response: {
        code: statusCode,
        body: form.body === "" ? undefined : form.body,
        headers: {
          ...rowsToHeaders(lockedHeader),
          ...rowsToHeaders(form.headers),
        },
      },
    };

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createMock(payload);
        toast.success("Mock created.");
      } else {
        if (!initial) {
          throw new Error("Mock ID is required for edit mode");
        }
        await patchMock(initial.id, payload);
        toast.success("Mock updated.");
      }

      await mutate();
      router.push("/mocks");
    } catch (error) {
      if (error instanceof ApiError && error.code === "BAD_REQUEST") {
        setServerErrors(toFormValidationErrors(error.validation));
        setTemplateError(null);
        setHideErrors(false);
      } else if (
        error instanceof ApiError &&
        error.code === "TEMPLATE_PARSE_ERROR"
      ) {
        setTemplateError(
          error.parsingError ?? {
            message: error.message,
            line: null,
            column: null,
          },
        );
        setHideErrors(false);
        setServerErrors({});
      } else {
        setTemplateError(null);
        setHideErrors(false);
        toast.error("Failed to save mock.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const bodyError = templateError;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit}
      aria-label={title}
    >
      <MockFormHeader isReadOnly={isReadOnly} title={title} />
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

        <div className="flex w-full flex-col gap-1.5">
          <Label>Response headers</Label>
          <HeadersEditor
            headers={form.headers}
            onChange={(h) => set("headers", h)}
            lockedHeaders={lockedHeader}
          />
        </div>

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
