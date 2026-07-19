"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mutate } from "swr";
import {
  ApiError,
  createCallback,
  patchCallback,
  toFormValidationErrors,
} from "@/lib/frontend/api";
import { useUnsavedChangesGuard } from "@/lib/frontend/hooks/use-unsaved-changes-guard";
import type { CallbackMethod } from "@/lib/types/callback";
import type { CallbackDto, PatchCallbackDto } from "@/lib/types/callback-dtos";
import type { ParsingError } from "@/lib/types/error-dtos";

type CallbackFormMode = "create" | "edit";

export type CallbackTargetMode = "host" | "url";

export type CallbackFormState = {
  slug: string;
  name: string;
  method: CallbackMethod;
  targetMode: CallbackTargetMode;
  host: string;
  path: string;
  url: string;
  delay: string;
  headers: { key: string; value: string }[];
  body: string;
};

export type CallbackFormErrors = {
  form?: string;
  slug?: string;
  host?: string;
  path?: string;
  url?: string;
  delay?: string;
};

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

function getInitialFormState(initial?: CallbackDto): CallbackFormState {
  return {
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    method: initial?.method ?? "POST",
    targetMode: initial?.url ? "url" : "host",
    host: initial?.host ?? "",
    path: initial?.path ?? "",
    url: initial?.url ?? "",
    delay: initial ? String(initial.delay) : "0",
    headers: headersToRows(initial?.headers ?? {}),
    body: initial?.body ?? "",
  };
}

function getFormErrors(
  form: CallbackFormState,
  mode: CallbackFormMode,
): CallbackFormErrors {
  const errors: CallbackFormErrors = {};

  if (mode === "create") {
    const slug = form.slug.trim();
    if (!slug) {
      errors.slug = "Slug is required.";
    } else if (!/^[a-zA-Z0-9_-]{1,64}$/.test(slug)) {
      errors.slug = "Invalid format.";
    }
  }

  if (form.targetMode === "host") {
    if (!form.host) {
      errors.host = "Host is required.";
    }
    if (!form.path.trim()) {
      errors.path = "Path is required.";
    }
  } else {
    const url = form.url.trim();
    if (!url) {
      errors.url = "URL is required.";
    } else {
      try {
        new URL(url);
        if (!/^https?:\/\//.test(url)) {
          errors.url = "URL must start with http:// or https://.";
        }
      } catch {
        errors.url = "URL must be a valid URL.";
      }
    }
  }

  const delay = form.delay.trim();
  if (delay && (!/^\d+$/.test(delay) || Number.parseInt(delay, 10) < 0)) {
    errors.delay = "Delay must be zero or a positive number.";
  }

  return errors;
}

export function useCallbackForm(
  initial: CallbackDto | undefined,
  mode: CallbackFormMode,
) {
  const router = useRouter();
  const [form, setForm] = useState<CallbackFormState>(() =>
    getInitialFormState(initial),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<CallbackFormErrors>({});
  const [templateError, setTemplateError] = useState<ParsingError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReadOnly = initial?.annotations.includes("READ_ONLY") ?? false;
  const baselineJson = useMemo(
    () => JSON.stringify(getInitialFormState(initial)),
    [initial],
  );
  const localErrors = getFormErrors(form, mode);
  const errors: CallbackFormErrors = {
    form: serverErrors.form,
    slug: localErrors.slug ?? serverErrors.slug,
    host: localErrors.host ?? serverErrors.host,
    path: localErrors.path ?? serverErrors.path,
    url: localErrors.url ?? serverErrors.url,
    delay: localErrors.delay ?? serverErrors.delay,
  };
  const hasErrors = Boolean(
    errors.slug || errors.host || errors.path || errors.url || errors.delay,
  );
  const isDirty = useMemo(
    () => !isReadOnly && JSON.stringify(form) !== baselineJson,
    [baselineJson, form, isReadOnly],
  );
  const {
    isConfirmingDiscard,
    confirmDiscard,
    keepEditing,
    navigateWithGuard,
  } = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    setForm(getInitialFormState(initial));
    setShowErrors(false);
    setServerErrors({});
    setTemplateError(null);
  }, [initial]);

  function set<K extends keyof CallbackFormState>(
    key: K,
    value: CallbackFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setShowErrors(false);
    setServerErrors({});
    setTemplateError(null);
  }

  function buildPayload(): PatchCallbackDto {
    const target =
      form.targetMode === "host"
        ? { host: form.host, path: form.path.trim() }
        : { url: form.url.trim() };

    return {
      name: form.name.trim() || undefined,
      method: form.method,
      ...target,
      delay: form.delay.trim() ? Number.parseInt(form.delay.trim(), 10) : 0,
      headers: rowsToHeaders(form.headers),
      body: form.body || undefined,
    };
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
    isReadOnly: boolean,
  ) {
    event.preventDefault();
    if (isReadOnly) {
      return;
    }

    if (hasErrors) {
      setShowErrors(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createCallback({ slug: form.slug.trim(), ...buildPayload() });
        toast.success("Callback created.");
      } else {
        if (!initial) {
          throw new Error("Callback slug is required for edit mode");
        }

        await patchCallback(initial.slug, buildPayload());
        toast.success("Callback updated.");
      }

      await mutate("/api/callbacks");
      router.push("/callbacks");
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === "CALLBACK_SLUG_CONFLICT"
      ) {
        setServerErrors({ slug: "A callback with this slug already exists" });
        setShowErrors(true);
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
      } else if (error instanceof ApiError && error.code === "BAD_REQUEST") {
        setServerErrors(toFormValidationErrors(error.validation));
        setShowErrors(true);
      } else {
        toast.error(
          `Failed to ${mode === "create" ? "create" : "update"} callback.`,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    errors,
    form,
    confirmDiscard,
    isConfirmingDiscard,
    isDirty,
    isSubmitting,
    keepEditing,
    navigateWithGuard,
    set,
    showErrors,
    templateError,
    handleSubmit,
  };
}
