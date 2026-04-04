"use client";

import { useState } from "react";
import Link from "next/link";
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

interface MockFormProps {
  initial?: Mock;
  mode: "create" | "edit";
}

interface FormState {
  name: string;
  method: Mock["method"];
  path: string;
  statusCode: string;
  headers: { key: string; value: string }[];
  body: string;
}

function headersToRows(headers: Record<string, string>) {
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

export function MockForm({ initial, mode }: MockFormProps) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? "",
    method: initial?.method ?? "GET",
    path: initial?.path ?? "",
    statusCode: String(initial?.response.code ?? "200"),
    headers: initial ? headersToRows(initial.response.headers) : [],
    body: initial?.response.body ?? "",
  });

  const isReadOnly = initial?.annotations.includes("READ_ONLY") ?? false;
  const title = mode === "create" ? "Create mock" : "Edit mock";
  const submitLabel = mode === "create" ? "Create" : "Save changes";

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="flex flex-col gap-6 max-w-2xl mx-auto px-8 pt-8 pb-8"
      onSubmit={(e) => e.preventDefault()}
      aria-label={title}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        {initial?.annotations.includes("READ_ONLY") && (
          <span className="text-xs text-muted-foreground border border-muted-foreground/30 rounded-md px-2 py-0.5">
            READ_ONLY
          </span>
        )}
      </div>

      <fieldset className="flex flex-col gap-4" disabled={isReadOnly}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mock-name">Name</Label>
          <Input
            id="mock-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Get user profile"
            aria-required="true"
            readOnly={isReadOnly}
          />
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
              placeholder="/api/users/:id"
              aria-required="true"
              readOnly={isReadOnly}
              className="font-mono text-sm"
            />
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
            min={100}
            max={599}
            aria-required="true"
            readOnly={isReadOnly}
          />
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
          <BodyEditor value={form.body} onChange={(v) => set("body", v)} />
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
          <Button type="submit" disabled>
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
