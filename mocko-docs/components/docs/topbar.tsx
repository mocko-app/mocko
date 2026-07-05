import Image from "next/image";
import Link from "next/link";
import { CloudIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocsSearch } from "@/components/docs/search";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

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

        <Link href="/" className="flex items-center gap-2.5">
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

      <div className="flex items-center gap-3 sm:gap-4">
        <DocsSearch />
        <a
          href="https://github.com/mocko-app/mocko"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="GitHub"
          className="text-[13px] text-muted-foreground transition-colors hover:text-fg-2"
        >
          <GitHubIcon className="size-4 sm:hidden" />
          <span className="hidden sm:inline">GitHub ↗</span>
        </a>
        <a
          href="https://app.mocko.dev"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Mocko Cloud"
          className="text-[13px] text-muted-foreground transition-colors hover:text-fg-2"
        >
          <CloudIcon className="size-4 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">Mocko Cloud ↗</span>
        </a>
      </div>
    </header>
  );
}
