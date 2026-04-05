"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { FlagBreadcrumb } from "@/components/flags/flag-breadcrumb";
import {
  getParentHref,
  parseFlagKeyCrumbs,
  parsePrefixCrumbs,
} from "@/components/flags/crumbs";
import { FlagDeleteDialog } from "@/components/flags/flag-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlagEditor } from "@/components/monaco-editor";
import { deleteFlag, putFlag, toApiError } from "@/lib/frontend/api";

type FlagFormProps =
  | { mode: "create"; prefix?: string }
  | { mode: "view"; flagKey: string; initialValue: string };

export function FlagForm(props: FlagFormProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const isCreate = props.mode === "create";
  const flagKey = isCreate ? undefined : props.flagKey;
  const initialValue = isCreate ? "" : props.initialValue;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [keyInput, setKeyInput] = useState(
    isCreate ? (props.prefix ?? "") : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const crumbs = isCreate
    ? [...parsePrefixCrumbs(props.prefix ?? ""), { label: "New flag" }]
    : parseFlagKeyCrumbs(flagKey!);

  const parentHref = flagKey
    ? getParentHref(flagKey)
    : `/flags${isCreate && props.prefix ? `?prefix=${props.prefix}` : ""}`;

  const isReadOnly = !isCreate && !isEditing;
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

  function handleCancelEdit() {
    setIsEditing(false);
    setValue(initialValue);
  }

  async function handleSubmit() {
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

    try {
      setIsSubmitting(true);
      await putFlag(targetKey, { value });
      await revalidateFlagCaches();
      if (isCreate) {
        router.push(`/flags/${encodeURIComponent(targetKey)}`);
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to save flag", error);
      toast.error(getErrorMessage(error, "Failed to save flag"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <FlagBreadcrumb crumbs={crumbs} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white tracking-tight truncate">
          {title}
        </h1>
        {!isCreate && !isEditing && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label="Edit flag value"
            >
              <PencilIcon aria-hidden="true" />
              Edit
            </Button>
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
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="flag-key">Key</Label>
        {isCreate ? (
          <Input
            id="flag-key"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="my-flag"
            className="font-mono text-sm"
            aria-required="true"
            disabled={isSubmitting}
          />
        ) : (
          <div
            className="px-3 py-2 rounded-lg bg-muted border border-border font-mono text-sm text-muted-foreground select-all"
            aria-label={`Flag key: ${flagKey}`}
          >
            {flagKey}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Value</Label>
        <p className="text-xs text-muted-foreground">
          Value must be valid JSON. To store a string, wrap it in double quotes.
        </p>
        <FlagEditor value={value} onChange={setValue} readOnly={isReadOnly} />
      </div>

      {(isCreate || isEditing) && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={
              isCreate ? () => router.push(parentHref) : handleCancelEdit
            }
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isCreate ? "Create" : "Save changes"}
          </Button>
        </div>
      )}

      {flagKey && (
        <FlagDeleteDialog
          open={showDeleteDialog}
          flagKey={flagKey}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
          onDontAskAgain={() => setSkipDeleteConfirm(true)}
        />
      )}
    </div>
  );
}
