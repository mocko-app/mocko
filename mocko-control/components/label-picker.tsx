"use client";

import { useState } from "react";
import { PlusIcon, TagIcon, XIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { labelStyle } from "@/lib/utils/labels";
import { cn } from "@/lib/utils";

type LabelPickerProps = {
  value: string[];
  onChange: (labels: string[]) => void;
  availableLabels: string[];
  readOnly?: boolean;
};

export function LabelPicker({
  value,
  onChange,
  availableLabels,
  readOnly = false,
}: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  function isSelected(label: string) {
    return value.some((l) => l.toLowerCase() === label.toLowerCase());
  }

  function toggle(label: string) {
    if (isSelected(label)) {
      onChange(value.filter((l) => l.toLowerCase() !== label.toLowerCase()));
    } else {
      onChange([...value, label]);
    }
  }

  function remove(label: string) {
    onChange(value.filter((l) => l.toLowerCase() !== label.toLowerCase()));
  }

  function create(name: string) {
    const trimmed = name.trim();
    if (!trimmed || isSelected(trimmed)) return;
    onChange([...value, trimmed]);
    setSearch("");
  }

  const trimmedSearch = search.trim();
  const filteredLabels = search
    ? availableLabels.filter((l) =>
        l.toLowerCase().includes(search.toLowerCase()),
      )
    : availableLabels;
  const canCreate =
    trimmedSearch.length > 0 &&
    !availableLabels.some(
      (l) => l.toLowerCase() === trimmedSearch.toLowerCase(),
    );

  if (readOnly) {
    return value.length === 0 ? (
      <span className="text-xs text-muted-foreground">No labels</span>
    ) : (
      <div className="flex flex-wrap gap-1.5">
        {value.map((label) => (
          <span
            key={label}
            style={labelStyle(label)}
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
          >
            {label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "gap-1.5 text-muted-foreground border-dashed",
                open && "border-solid text-foreground",
              )}
              aria-label="Add label"
            />
          }
        >
          <TagIcon className="size-3" />
          Add label
        </PopoverTrigger>
        <PopoverContent align="start" side="bottom" className="w-56 p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or create…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filteredLabels.length === 0 && !canCreate && (
                <CommandEmpty>No labels yet.</CommandEmpty>
              )}
              {filteredLabels.length > 0 && (
                <CommandGroup>
                  {filteredLabels.map((label) => (
                    <CommandItem
                      key={label}
                      value={label}
                      data-checked={isSelected(label)}
                      onSelect={() => toggle(label)}
                    >
                      <span
                        style={labelStyle(label)}
                        className="size-2.5 rounded-full border shrink-0"
                      />
                      {label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {canCreate && (
                <>
                  {filteredLabels.length > 0 && <CommandSeparator />}
                  <CommandGroup>
                    <CommandItem
                      value={`__create__${trimmedSearch}`}
                      onSelect={() => create(trimmedSearch)}
                    >
                      <PlusIcon className="size-3.5 shrink-0" />
                      Create &ldquo;{trimmedSearch}&rdquo;
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.map((label) => (
        <span
          key={label}
          style={labelStyle(label)}
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
        >
          {label}
          <Button
            type="button"
            onClick={() => remove(label)}
            variant="ghost"
            size="icon-xs"
            className="size-auto rounded-full p-0 text-current opacity-60 transition-opacity hover:bg-transparent hover:text-current hover:opacity-100"
            aria-label={`Remove label ${label}`}
          >
            <XIcon className="size-3" />
          </Button>
        </span>
      ))}
    </div>
  );
}
