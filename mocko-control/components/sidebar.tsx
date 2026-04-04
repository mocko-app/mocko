"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGridIcon,
  FlagIcon,
  BookOpenIcon,
  SquareCodeIcon,
} from "lucide-react";
import { useMocks } from "@/lib/frontend/hooks/resources";

const navItems = [
  { label: "Mocks", href: "/mocks", icon: LayoutGridIcon },
  { label: "Flags", href: "/flags", icon: FlagIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data } = useMocks();
  const mockCount = data?.length ?? 0;

  return (
    <aside
      className="flex w-52 shrink-0 flex-col py-5 px-3 gap-1"
      aria-label="Main navigation"
    >
      <div className="px-3 mb-5 flex items-center gap-2">
        <img
          src="https://cdn.codetunnel.net/mocko/logo-white.svg"
          alt=""
          aria-hidden="true"
          className="w-8 h-8 object-contain shrink-0"
        />
        <span className="font-semibold text-sm tracking-tight text-white">
          Mocko
        </span>
      </div>

      <div className="px-3 mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
        Project
      </div>

      <nav className="flex flex-col gap-1" role="navigation">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-[14px] shrink-0" aria-hidden="true" />
              {label}
              {active && (
                <span className="ml-auto text-[10px] font-mono bg-primary/20 text-primary px-1.5 py-1 rounded leading-none">
                  {mockCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mt-4 mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
        Links
      </div>
      <nav className="flex flex-col gap-1" aria-label="External links">
        <a
          href="https://mocko.dev/docs/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <BookOpenIcon className="size-[14px] shrink-0" aria-hidden="true" />
          Documentation
        </a>
        <a
          href="https://github.com/mocko-app/mocko"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <SquareCodeIcon className="size-[14px] shrink-0" aria-hidden="true" />
          GitHub
        </a>
        {/* <a
          href="https://status.mocko.dev/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ActivityIcon className="size-[14px] shrink-0" aria-hidden="true" />
          Status
        </a> */}
      </nav>
    </aside>
  );
}
