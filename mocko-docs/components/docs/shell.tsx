"use client";

import { useEffect, useState } from "react";
import { DocsSidebar } from "@/components/docs/sidebar";
import { DocsTopbar } from "@/components/docs/topbar";

export function DocsShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex h-full flex-col">
      <DocsTopbar onOpenMobileNav={() => setMobileNavOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="hidden w-[212px] shrink-0 overflow-y-auto border-r border-border py-5 px-2.5 md:block"
          aria-label="Documentation navigation"
        >
          <DocsSidebar />
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div
            data-pagefind-body
            className="mx-auto max-w-3xl px-6 py-10 lg:px-10"
          >
            {children}
          </div>
        </main>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 h-full w-[min(22rem,88vw)] overflow-y-auto border-r border-border bg-background px-5 py-6 shadow-2xl">
            <DocsSidebar mobile onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
