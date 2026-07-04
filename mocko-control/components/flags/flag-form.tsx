"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { TrashIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/callout";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { ConfirmDiscardDialog } from "@/components/confirm-discard-dialog";
import { SaveChangesButton } from "@/components/save-changes-button";
import { FlagBreadcrumb } from "@/components/flags/flag-breadcrumb";
import {
  getParentHref,
  parseFlagKeyCrumbs,
  parsePrefixCrumbs,
} from "@/components/flags/crumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlagEditor } from "@/components/monaco-editor";
import { deleteFlag, putFlag, toApiError } from "@/lib/frontend/api";
import { useUnsavedChangesGuard } from "@/lib/frontend/hooks/use-unsaved-changes-guard";
import { getFlagKeyValidationError } from "@/lib/validation/flag.schema";

type FlagFormProps =
  | { mode: "create"; prefix?: string }
  | { mode: "edit"; flagKey: string; serverValue: string };

export function FlagForm(props: FlagFormProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const isCreate = props.mode === "create";
  const flagKey = isCreate ? undefined : props.flagKey;
  const serverValue = isCreate ? "" : props.serverValue;
  const initialKey = isCreate ? (props.prefix ?? "") : "";

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  const [value, setValue] = useState(serverValue);
  const [baseline, setBaseline] = useState(serverValue);
  const [keyInput, setKeyInput] = useState(initialKey);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = isCreate
    ? keyInput !== initialKey || value !== ""
    : value !== baseline;
  const hasServerDrift = !isCreate && isDirty && serverValue !== baseline;

  const {
    isConfirmingDiscard,
    confirmDiscard,
    keepEditing,
    navigateWithGuard,
  } = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    if (!isCreate && value === baseline && serverValue !== baseline) {
      setValue(serverValue);
      setBaseline(serverValue);
    }
  }, [isCreate, serverValue, value, baseline]);

  const crumbs = isCreate
    ? [...parsePrefixCrumbs(props.prefix ?? ""), { label: "New flag" }]
    : parseFlagKeyCrumbs(flagKey!);

  const parentHref = flagKey
    ? getParentHref(flagKey)
    : `/flags${isCreate && props.prefix ? `?prefix=${props.prefix}` : ""}`;

  const title = isCreate ? "New flag" : flagKey!.split(":").at(-1)!;

  async function revalidateFlagCaches() {
    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/flags"),
      undefined,
      { revalidate: true },
    );
  }

  function getErrorMessage(error: unknown, fallback: string): string {
    const apiError = toApiError(error);
    return apiError.message || fallback;
  }

  function loadServerValue() {
    setValue(serverValue);
    setBaseline(serverValue);
  }

  async function handleDelete() {
    if (!flagKey) {
      return;
    }

    if (skipDeleteConfirm) {
      try {
        setIsSubmitting(true);
        await deleteFlag(flagKey);
        await revalidateFlagCaches();
        router.push(parentHref);
      } catch (error) {
        console.error("Failed to delete flag", error);
        toast.error(getErrorMessage(error, "Failed to delete flag"));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setShowDeleteDialog(true);
  }

  async function handleDeleteConfirm() {
    if (!flagKey) {
      return;
    }

    try {
      setIsSubmitting(true);
      setShowDeleteDialog(false);
      await deleteFlag(flagKey);
      await revalidateFlagCaches();
      router.push(parentHref);
    } catch (error) {
      console.error("Failed to delete flag", error);
      toast.error(getErrorMessage(error, "Failed to delete flag"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const targetKey = isCreate ? keyInput.trim() : flagKey;
    if (!targetKey) {
      if (isCreate) {
        toast.error("Flag key is required");
      }
      return;
    }
    if (isCreate) {
      const validationError = getFlagKeyValidationError(targetKey);
      if (validationError) {
        setKeyError(validationError);
        return;
      }
      setKeyError(null);
    }

    try {
      setIsSubmitting(true);
      const updated = await putFlag(targetKey, value);
      if (isCreate) {
        await revalidateFlagCaches();
        toast.success("Flag created.");
        router.push(`/flags/${encodeURIComponent(targetKey)}`);
      } else {
        await mutate(`/api/flags/${encodeURIComponent(targetKey)}`, updated, {
          revalidate: false,
        });
        setBaseline(value);
        toast.success("Flag saved.");
        await revalidateFlagCaches();
      }
    } catch (error) {
      console.error("Failed to save flag", error);
      toast.error(getErrorMessage(error, "Failed to save flag"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit}
      aria-label={title}
    >
      <FlagBreadcrumb crumbs={crumbs} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white tracking-tight truncate">
          {title}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          {!isCreate && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/60"
              onClick={handleDelete}
              disabled={isSubmitting}
              aria-label={`Delete flag ${flagKey}`}
            >
              <TrashIcon aria-hidden="true" />
              Delete
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => navigateWithGuard(parentHref)}
            aria-label="Close and return to flags"
          >
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      </div>

      {hasServerDrift && (
        <Callout
          title="This flag changed on the server"
          message="Your unsaved edits are based on an older value. Saving will overwrite the server value."
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadServerValue}>
                Load server value
              </Button>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={
                  <Link
                    href={`/flags/${encodeURIComponent(flagKey!)}`}
                    target="_blank"
                  />
                }
              >
                View in new tab
              </Button>
            </div>
          }
        />
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="flag-key">Key</Label>
        {isCreate ? (
          <Input
            id="flag-key"
            value={keyInput}
            onChange={(e) => {
              setKeyInput(e.target.value);
              if (keyError) {
                setKeyError(null);
              }
            }}
            placeholder="my-flag"
            className="font-mono text-sm"
            aria-required="true"
            disabled={isSubmitting}
            aria-invalid={Boolean(keyError)}
            autoFocus
          />
        ) : (
          <div
            className="px-3 py-2 rounded-lg bg-muted border border-border font-mono text-sm text-muted-foreground select-all"
            aria-label={`Flag key: ${flagKey}`}
          >
            {flagKey}
          </div>
        )}
        {isCreate && keyError && (
          <p className="text-xs text-destructive">{keyError}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Value</Label>
        <p className="text-xs text-muted-foreground">
          Value must be valid JSON. To store a string, wrap it in double quotes.
        </p>
        <FlagEditor value={value} onChange={setValue} />
      </div>

      <div className="flex items-center gap-2">
        <SaveChangesButton
          label={isCreate ? "Create" : "Save changes"}
          pristine={!isCreate && !isDirty}
          isSubmitting={isSubmitting}
        />
      </div>

      <ConfirmDiscardDialog
        open={isConfirmingDiscard}
        onDiscard={confirmDiscard}
        onKeepEditing={keepEditing}
      />

      {flagKey && (
        <ConfirmDeleteDialog
          open={showDeleteDialog}
          title="Delete flag"
          itemLabel={flagKey}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
          onDontAskAgain={() => setSkipDeleteConfirm(true)}
        >
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground font-mono">
            {flagKey}
          </span>
          ? This action cannot be undone.
        </ConfirmDeleteDialog>
      )}
    </form>
  );
}
