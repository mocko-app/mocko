"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutGridIcon, FlagIcon, BookOpenIcon } from "lucide-react";

const navItems = [
  { label: "Mocks", href: "/mocks", icon: LayoutGridIcon, external: false },
  { label: "Flags", href: "/flags", icon: FlagIcon, external: false },
  {
    label: "Docs",
    href: "https://mocko.dev/docs/",
    icon: BookOpenIcon,
    external: true,
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden flex border-t border-[#1c1c1e] bg-background"
      aria-label="Main navigation"
    >
      {navItems.map(({ label, href, icon: Icon, external }) => {
        const active = !external && pathname.startsWith(href);
        const props = external
          ? { target: "_blank" as const, rel: "noreferrer" }
          : { "aria-current": active ? ("page" as const) : undefined };
        return (
          <Link
            key={href}
            href={href}
            {...props}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
