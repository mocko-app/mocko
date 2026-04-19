"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import {
  ApiError,
  createMock,
  patchMock,
  toFormValidationErrors,
} from "@/lib/frontend/api";
import { useMocks } from "@/lib/frontend/hooks/resources";
import type { ParsingError } from "@/lib/types/error-dtos";
import type { CreateMockDto, MockDetailsDto } from "@/lib/types/mock-dtos";

const RESERVED_PREFIX = "/__mocko__";

export const CONTENT_TYPES = [
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

export type ContentType = (typeof CONTENT_TYPES)[number]["id"];
type MockFormMode = "create" | "edit";

export type MockFormState = {
  name: string;
  method: CreateMockDto["method"];
  path: string;
  statusCode: string;
  delay: string;
  headers: { key: string; value: string }[];
  body: string;
  contentType: ContentType;
  labels: string[];
  hostSlug: string;
};

export type MockFormErrors = {
  form?: string;
  name?: string;
  path?: string;
  statusCode?: string;
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

function deriveInitialContentType(headers: Record<string, string>): {
  contentType: ContentType;
  filteredHeaders: { key: string; value: string }[];
} {
  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === "content-type",
  );
  const filteredHeaders = headersToRows(
    Object.fromEntries(
      Object.entries(headers).filter(
        ([key]) => key.toLowerCase() !== "content-type",
      ),
    ),
  );

  if (!entry) {
    return { contentType: "other", filteredHeaders };
  }

  const match = CONTENT_TYPES.find(
    (contentType) =>
      contentType.contentTypeHeader &&
      entry[1].toLowerCase() === contentType.contentTypeHeader.toLowerCase(),
  );
  if (match) {
    return { contentType: match.id, filteredHeaders };
  }

  return {
    contentType: "other",
    filteredHeaders: [{ key: entry[0], value: entry[1] }, ...filteredHeaders],
  };
}

function getInitialFormState(initial?: MockDetailsDto): MockFormState {
  if (!initial) {
    return {
      name: "",
      method: "GET",
      path: "",
      statusCode: "200",
      delay: "",
      headers: [],
      body: "",
      contentType: "json",
      labels: [],
      hostSlug: "",
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
    delay:
      initial.response.delay === undefined
        ? ""
        : String(initial.response.delay),
    headers: filteredHeaders,
    body: initial.response.body ?? "",
    contentType,
    labels: initial.labels ?? [],
    hostSlug: initial.host ?? "",
  };
}

function getFormErrors(form: MockFormState): MockFormErrors {
  const errors: MockFormErrors = {};
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

  const delay = form.delay.trim();
  if (delay) {
    const parsed = Number(delay);
    if (Number.isNaN(parsed)) {
      errors.delay = "Response delay must be a number.";
    } else if (!Number.isInteger(parsed)) {
      errors.delay = "Response delay must be an integer.";
    } else if (parsed < 0) {
      errors.delay = "Response delay must be at least 0.";
    } else if (parsed > 300000) {
      errors.delay = "Response delay must be at most 300000.";
    }
  }

  return errors;
}

export function useMockForm(
  initial: MockDetailsDto | undefined,
  mode: MockFormMode,
) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: mocksData, mutate: mutateMocks } = useMocks();
  const [form, setForm] = useState<MockFormState>(() =>
    getInitialFormState(initial),
  );
  const [hideErrors, setHideErrors] = useState(true);
  const [serverErrors, setServerErrors] = useState<MockFormErrors>({});
  const [templateError, setTemplateError] = useState<ParsingError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const localErrors = getFormErrors(form);
  const errors: MockFormErrors = {
    form: serverErrors.form,
    name: localErrors.name ?? serverErrors.name,
    path: localErrors.path ?? serverErrors.path,
    statusCode: localErrors.statusCode ?? serverErrors.statusCode,
    delay: localErrors.delay ?? serverErrors.delay,
  };
  const hasErrors = Boolean(
    errors.name || errors.path || errors.statusCode || errors.delay,
  );
  const showErrors = !hideErrors;
  const activeContentType = CONTENT_TYPES.find(
    (contentType) => contentType.id === form.contentType,
  )!;
  const lockedHeader = activeContentType.contentTypeHeader
    ? [{ key: "Content-Type", value: activeContentType.contentTypeHeader }]
    : [];

  useEffect(() => {
    if (initial?.annotations.includes("READ_ONLY")) {
      setForm(getInitialFormState(initial));
      setHideErrors(true);
      setServerErrors({});
      setTemplateError(null);
    }
  }, [initial]);

  function set<K extends keyof MockFormState>(key: K, value: MockFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHideErrors(true);
    setServerErrors({});
    setTemplateError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasErrors) {
      setHideErrors(false);
      return;
    }

    const statusCode = Number(form.statusCode.trim());
    const delay = form.delay.trim();
    const payload = {
      name: form.name.trim(),
      method: form.method,
      path: form.path.trim(),
      host: form.hostSlug || null,
      labels: form.labels,
      response: {
        code: statusCode,
        delay: delay === "" ? undefined : Number(delay),
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
        const updatedMock = await patchMock(initial.id, payload);
        await mutate(`/api/mocks/${initial.id}`, updatedMock, {
          revalidate: false,
        });
        toast.success("Mock updated.");
      }

      await mutateMocks();
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
        setServerErrors({});
        toast.error("Failed to save mock.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    errors,
    form,
    isSubmitting,
    lockedHeader,
    mocksData,
    set,
    showErrors,
    templateError,
    handleSubmit,
    activeContentType,
  };
}
