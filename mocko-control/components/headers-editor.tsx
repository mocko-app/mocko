"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Header = {
  key: string;
  value: string;
};

const VALID_HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

type HeadersEditorProps = {
  headers: Header[];
  onChange: (headers: Header[]) => void;
  lockedHeaders?: Header[];
};

export function HeadersEditor({
  headers,
  onChange,
  lockedHeaders = [],
}: HeadersEditorProps) {
  const hasLockedContentType = lockedHeaders.some(
    (header) => header.key.toLowerCase() === "content-type",
  );

  const keyCounts = headers.reduce<Record<string, number>>((counts, header) => {
    const key = header.key.trim().toLowerCase();
    if (key) counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  function addRow() {
    onChange([...headers, { key: "", value: "" }]);
  }

  function updateRow(index: number, field: "key" | "value", val: string) {
    const next = headers.map((h, i) =>
      i === index ? { ...h, [field]: val } : h,
    );
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(headers.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {lockedHeaders.map((header, i) => (
        <div key={`locked-${i}`} className="flex items-center gap-2">
          <Input
            value={header.key}
            disabled
            placeholder="Name"
            aria-label={`Locked header name ${i + 1}`}
            className="flex-1"
          />
          <Input
            value={header.value}
            disabled
            placeholder="Value"
            aria-label={`Locked header value ${i + 1}`}
            className="flex-1"
          />
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled
                aria-label={`Remove locked header ${i + 1}`}
              >
                <XIcon aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Added because you selected a body format
            </TooltipContent>
          </Tooltip>
        </div>
      ))}
      {headers.map((header, i) => {
        const trimmedKey = header.key.trim();
        const normalizedKey = trimmedKey.toLowerCase();
        const hasContentTypeConflict =
          hasLockedContentType && normalizedKey === "content-type";
        const isDuplicate = keyCounts[normalizedKey] > 1;
        const hasInvalidChars =
          trimmedKey !== "" && !VALID_HEADER_NAME.test(trimmedKey);

        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Input
                value={header.key}
                onChange={(e) => updateRow(i, "key", e.target.value)}
                placeholder="Name"
                aria-label={`Header name ${i + 1}`}
                className="flex-1"
              />
              <Input
                value={header.value}
                onChange={(e) => updateRow(i, "value", e.target.value)}
                placeholder="Value"
                aria-label={`Header value ${i + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeRow(i)}
                aria-label={`Remove header ${i + 1}`}
              >
                <XIcon aria-hidden="true" />
              </Button>
            </div>
            {hasContentTypeConflict && (
              <p className="text-xs text-amber-400">
                Content-Type is already set by the selected body format.
              </p>
            )}
            {hasInvalidChars && (
              <p className="text-xs text-amber-400">
                Header names may only contain letters, digits, and{" "}
                {"!#$%&'*+-.^_`|~"}.
              </p>
            )}
            {isDuplicate && !hasContentTypeConflict && (
              <p className="text-xs text-amber-400">Duplicate header name.</p>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        className="w-fit"
        aria-label="Add header"
      >
        <PlusIcon aria-hidden="true" />
        Add header
      </Button>
    </div>
  );
}
