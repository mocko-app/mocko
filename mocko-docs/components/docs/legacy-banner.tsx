import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

export function LegacyBanner({ v2href = "/docs" }: { v2href?: string }) {
  return (
    <div className="mb-8 flex gap-3 rounded-lg bg-amber-500/10 px-4 py-3.5 text-[13px] leading-[1.75] text-fg-2">
      <TriangleAlertIcon
        className="mt-0.5 size-4 shrink-0 text-amber-300"
        aria-hidden
      />
      <div>
        <strong className="text-foreground">
          You&apos;re reading Mocko v1 (legacy) documentation.
        </strong>{" "}
        Mocko v2 is the current version.{" "}
        <Link
          href={v2href}
          className="underline underline-offset-4 hover:text-foreground"
        >
          View the v2 docs
        </Link>
        .
      </div>
    </div>
  );
}
