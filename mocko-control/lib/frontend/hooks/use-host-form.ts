"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ApiError,
  createHost,
  patchHost,
  toFormValidationErrors,
} from "@/lib/frontend/api";
import type { HostDto } from "@/lib/types/host-dtos";

type HostFormMode = "create" | "edit";

export type HostFormState = {
  slug: string;
  name: string;
  source: string;
  destination: string;
};

export type HostFormErrors = {
  form?: string;
  slug?: string;
  source?: string;
  destination?: string;
};

function getInitialFormState(initial?: HostDto): HostFormState {
  return {
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    source: initial?.source ?? "",
    destination: initial?.destination ?? "",
  };
}

function getFormErrors(
  form: HostFormState,
  mode: HostFormMode,
): HostFormErrors {
  const errors: HostFormErrors = {};

  if (mode === "create") {
    const slug = form.slug.trim();
    if (!slug) {
      errors.slug = "Slug is required.";
    } else if (!/^[a-zA-Z0-9_-]{1,12}$/.test(slug)) {
      errors.slug = "Invalid format.";
    }
  }

  if (!form.source.trim()) {
    errors.source = "Source is required.";
  }
  if (!form.destination.trim()) {
    errors.destination = "Destination is required.";
  }

  return errors;
}

export function useHostForm(initial: HostDto | undefined, mode: HostFormMode) {
  const router = useRouter();
  const [form, setForm] = useState<HostFormState>(() =>
    getInitialFormState(initial),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<HostFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const localErrors = getFormErrors(form, mode);
  const errors: HostFormErrors = {
    form: serverErrors.form,
    slug: localErrors.slug ?? serverErrors.slug,
    source: localErrors.source ?? serverErrors.source,
    destination: localErrors.destination ?? serverErrors.destination,
  };
  const hasErrors = Boolean(errors.slug || errors.source || errors.destination);

  useEffect(() => {
    setForm(getInitialFormState(initial));
    setShowErrors(false);
    setServerErrors({});
  }, [initial]);

  function set<K extends keyof HostFormState>(key: K, value: HostFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setShowErrors(false);
    setServerErrors({});
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
        await createHost({
          slug: form.slug.trim(),
          name: form.name,
          source: form.source.trim(),
          destination: form.destination.trim(),
        });
        toast.success("Host created.");
      } else {
        if (!initial) {
          throw new Error("Host slug is required for edit mode");
        }

        await patchHost(initial.slug, {
          name: form.name,
          source: form.source.trim(),
          destination: form.destination.trim(),
        });
        toast.success("Host updated.");
      }

      router.push("/hosts");
    } catch (error) {
      if (error instanceof ApiError && error.code === "HOST_SLUG_CONFLICT") {
        setServerErrors({ slug: "A host with this slug already exists" });
        setShowErrors(true);
      } else if (error instanceof ApiError && error.code === "BAD_REQUEST") {
        setServerErrors(toFormValidationErrors(error.validation));
        setShowErrors(true);
      } else {
        toast.error(
          `Failed to ${mode === "create" ? "create" : "update"} host.`,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    errors,
    form,
    isSubmitting,
    set,
    showErrors,
    handleSubmit,
  };
}
