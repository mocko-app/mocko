"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGridIcon,
  FlagIcon,
  ServerIcon,
  BookOpenIcon,
  SquareCodeIcon,
  WebhookIcon,
  WrenchIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useVersions } from "@/lib/frontend/hooks/resources";

function VersionFooter() {
  const { data: versions } = useVersions();
  if (!versions) {
    return null;
  }

  const { control, core } = versions;
  if (!control && !core) {
    return null;
  }

  if (control && core && control === core) {
    return (
      <div className="mt-auto hidden lg:flex flex-col gap-0.5 px-3 pb-1 items-center">
        <span className="text-xs text-muted-foreground/50">v{control}</span>
      </div>
    );
  }

  return (
    <div className="mt-auto hidden lg:flex flex-col gap-0.5 px-3 pb-1 items-center">
      {control && (
        <span className="text-xs text-muted-foreground/50">
          Control v{control}
        </span>
      )}
      {core && (
        <span className="text-xs text-muted-foreground/50">Core v{core}</span>
      )}
    </div>
  );
}

const navItems = [
  { label: "Mocks", href: "/mocks", icon: LayoutGridIcon },
  { label: "Flags", href: "/flags", icon: FlagIcon },
  { label: "Hosts", href: "/hosts", icon: ServerIcon },
  { label: "Callbacks", href: "/callbacks", icon: WebhookIcon },
  { label: "Management", href: "/management", icon: WrenchIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex w-12 lg:w-52 shrink-0 flex-col py-5 px-1.5 lg:px-3 gap-1"
      aria-label="Main navigation"
    >
      <a
        href="https://mocko.dev/"
        target="_blank"
        rel="noreferrer"
        className="px-1.5 lg:px-3 mb-5 flex items-center justify-center lg:justify-start gap-2"
        aria-label="Open mocko.dev in a new tab"
      >
        <Image
          src="https://cdn.codetunnel.net/mocko/logo-white.svg"
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          className="w-8 h-8 object-contain shrink-0"
        />
        <span className="hidden lg:block font-semibold text-sm tracking-tight text-white">
          Mocko
        </span>
      </a>

      <div className="hidden lg:block px-3 mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
        Project
      </div>

      <nav className="flex flex-col gap-1" role="navigation">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Tooltip key={href}>
              <TooltipTrigger
                render={
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                  />
                }
                className={cn(
                  "flex items-center justify-center lg:justify-start gap-2.5 px-0 lg:px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-[14px] shrink-0" aria-hidden="true" />
                <span className="hidden lg:block">{label}</span>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="hidden lg:block px-3 mt-4 mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
        Links
      </div>
      <nav className="flex flex-col gap-1" aria-label="External links">
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href="https://mocko.dev/docs/"
                target="_blank"
                rel="noreferrer"
              />
            }
            className="flex items-center justify-center lg:justify-start gap-2.5 px-0 lg:px-3 py-2 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <BookOpenIcon className="size-[14px] shrink-0" aria-hidden="true" />
            <span className="hidden lg:block">Docs</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden">
            Docs
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href="https://github.com/mocko-app/mocko"
                target="_blank"
                rel="noreferrer"
              />
            }
            className="flex items-center justify-center lg:justify-start gap-2.5 px-0 lg:px-3 py-2 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <SquareCodeIcon
              className="size-[14px] shrink-0"
              aria-hidden="true"
            />
            <span className="hidden lg:block">GitHub</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden">
            GitHub
          </TooltipContent>
        </Tooltip>
      </nav>

      <VersionFooter />
    </aside>
  );
}
