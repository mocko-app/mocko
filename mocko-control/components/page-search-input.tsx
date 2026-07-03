import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

type PageSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  inputClassName?: string;
};

export function PageSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
  inputClassName,
}: PageSearchInputProps) {
  return (
    <div className={className}>
      <div className="relative max-w-sm">
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#444]"
          aria-hidden="true"
        />
        <Input
          className={
            inputClassName ??
            "w-full border-input bg-muted pl-9 pr-9 placeholder:text-[#3a3a3a] focus-visible:border-[#444] focus-visible:ring-1 focus-visible:ring-[#444]"
          }
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={ariaLabel}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search field"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
