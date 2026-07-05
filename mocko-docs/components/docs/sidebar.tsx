"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  docsHomeItem,
  docsLegacyItem,
  docsNavGroups,
  docsV1HomeItem,
  docsV1NavGroups,
  isNavItemActive,
} from "@/components/docs/nav-data";

type Props = {
  onNavigate?: () => void;
  mobile?: boolean;
};

export function DocsSidebar({ onNavigate, mobile = false }: Props) {
  const pathname = usePathname();
  const isV1 = pathname.startsWith("/docs/v1");

  const linkClass = (active: boolean) =>
    cn(
      "block rounded-md px-3 py-[7px] text-[13px] transition-colors",
      active
        ? "bg-primary/10 text-primary font-medium"
        : "text-[#909096] hover:bg-border hover:text-foreground",
    );

  if (isV1) {
    return (
      <nav
        className={cn("flex flex-col", mobile ? "gap-6" : "gap-7")}
        aria-label="Documentation navigation"
      >
        {/* Back to v2 */}
        <div className="flex flex-col gap-0.5">
          <Link
            href="/docs"
            onClick={onNavigate}
            className="flex items-center gap-1.5 rounded-md px-3 py-[7px] text-[13px] text-[#909096] transition-colors hover:bg-border hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" aria-hidden />
            Back to v2 docs
          </Link>
        </div>

        <div className="flex flex-col gap-0.5">
          <Link
            href={docsV1HomeItem.href}
            onClick={onNavigate}
            aria-current={pathname === docsV1HomeItem.href ? "page" : undefined}
            className={linkClass(pathname === docsV1HomeItem.href)}
          >
            {docsV1HomeItem.title}
          </Link>
        </div>

        {docsV1NavGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(linkClass(active), "pl-5")}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className={cn("flex flex-col", mobile ? "gap-6" : "gap-7")}
      aria-label="Documentation navigation"
    >
      <div className="flex flex-col gap-0.5">
        <Link
          href={docsHomeItem.href}
          onClick={onNavigate}
          aria-current={pathname === docsHomeItem.href ? "page" : undefined}
          className={linkClass(pathname === docsHomeItem.href)}
        >
          {docsHomeItem.title}
        </Link>
      </div>

      {docsNavGroups.map((group) => (
        <div key={group.title}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(linkClass(active), "pl-5")}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="border-t border-border pt-4">
        <Link
          href={docsLegacyItem.href}
          onClick={onNavigate}
          aria-current={pathname === docsLegacyItem.href ? "page" : undefined}
          className={cn(
            linkClass(pathname === docsLegacyItem.href),
            "flex items-center gap-1.5",
          )}
        >
          {docsLegacyItem.title}
          <ExternalLinkIcon className="size-[11px] opacity-50" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
