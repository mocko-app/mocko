import Image from "next/image";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocsTopbar({
  onOpenMobileNav,
}: {
  onOpenMobileNav: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-5">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
        >
          <MenuIcon className="size-4" aria-hidden />
        </Button>

        <Link href="/docs" className="flex items-center gap-2.5">
          <Image
            src="https://cdn.codetunnel.net/mocko/logo-white.svg"
            alt="Mocko"
            width={28}
            height={28}
            className="size-7 shrink-0"
          />
          <div>
            <p className="text-[13px] font-semibold leading-none tracking-tight text-foreground">
              Mocko Docs
            </p>
            <p className="mt-0.5 text-[11px] leading-none text-muted-foreground">
              Dynamic HTTP mocking
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <a
          href="https://github.com/mocko-app/mocko"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[13px] text-muted-foreground transition-colors hover:text-fg-2"
        >
          GitHub ↗
        </a>
        <a
          href="https://app.mocko.dev"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[13px] text-muted-foreground transition-colors hover:text-fg-2"
        >
          Mocko Cloud ↗
        </a>
      </div>
    </header>
  );
}
