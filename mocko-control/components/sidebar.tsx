"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutGridIcon, ArrowUpFromLineIcon } from "lucide-react";
import { FIXTURE_MOCKS } from "@/lib/mock/mock.fixtures";

const navItems = [
  { label: "Mocks", href: "/mocks", icon: LayoutGridIcon },
  { label: "Flags", href: "/flags", icon: ArrowUpFromLineIcon, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const mockCount = FIXTURE_MOCKS.length;

  return (
    <aside
      className="flex w-52 shrink-0 flex-col py-5 px-3 gap-1"
      aria-label="Main navigation"
    >
      <div className="px-3 mb-5 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 4h8M2 8h5"
              stroke="var(--primary-foreground)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="font-semibold text-sm tracking-tight text-white">
          mocko
        </span>
      </div>

      <div className="px-3 mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
        Workspace
      </div>

      <nav className="flex flex-col gap-0.5" role="navigation">
        {navItems.map(({ label, href, icon: Icon, disabled }) => {
          const active = pathname.startsWith(href);

          if (disabled) {
            return (
              <span
                key={href}
                aria-disabled="true"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground cursor-default select-none"
              >
                <Icon className="size-[14px] shrink-0" aria-hidden="true" />
                {label}
              </span>
            );
          }

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
    </aside>
  );
}
