"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileTextIcon, SearchIcon } from "lucide-react";

type SearchResult = {
  url: string;
  title: string;
  excerpt: string;
};

type PagefindModule = {
  init: () => Promise<void>;
  debouncedSearch: (query: string) => Promise<{
    results: {
      data: () => Promise<{
        url: string;
        excerpt: string;
        meta: { title?: string };
      }>;
    }[];
  } | null>;
};

let pagefindPromise: Promise<PagefindModule | null> | null = null;

function loadPagefind(): Promise<PagefindModule | null> {
  pagefindPromise ??= (async () => {
    try {
      const load = new Function(
        "return import('/docs/pagefind/pagefind.js')",
      ) as () => Promise<PagefindModule>;
      const pagefind = await load();
      await pagefind.init();
      return pagefind;
    } catch {
      return null;
    }
  })();

  return pagefindPromise;
}

function toHref(url: string) {
  return url
    .replace(/^\/docs/, "")
    .replace(/\.html$/, "")
    .replace(/^$/, "/");
}

export function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        if (open) {
          close();
        } else {
          setOpen(true);
        }
      }

      if (event.key === "Escape" && open) {
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const runSearch = useCallback(async (value: string) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }

    const pagefind = await loadPagefind();
    if (!pagefind) {
      setUnavailable(true);
      return;
    }

    const response = await pagefind.debouncedSearch(value);
    if (!response) {
      return;
    }

    const loaded = await Promise.all(
      response.results.slice(0, 8).map((result) => result.data()),
    );

    setResults(
      loaded.map((data) => ({
        url: toHref(data.url),
        title: data.meta.title ?? "Untitled",
        excerpt: data.excerpt,
      })),
    );
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search documentation"
        className="flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-fg-2 sm:w-56 sm:rounded-md sm:border sm:border-border sm:bg-card sm:py-1.5 sm:pl-2.5 sm:pr-2 md:w-64 lg:w-80"
      >
        <SearchIcon className="size-4" aria-hidden />
        <span className="hidden sm:inline">Search docs...</span>
        <kbd className="ml-auto hidden rounded border border-border bg-background px-1 font-mono text-[10px] leading-4 text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 bg-black/60"
            onClick={close}
          />
          <div className="relative z-10 mx-auto mt-[12vh] w-[min(36rem,92vw)] overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-border px-4">
              <SearchIcon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  void runSearch(event.target.value);
                }}
                placeholder="Search the docs..."
                className="h-12 w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              <kbd className="shrink-0 rounded border border-border bg-card px-1.5 font-mono text-[10px] leading-5 text-muted-foreground">
                esc
              </kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {unavailable ? (
                <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                  The search index is generated at build time and is not
                  available on the dev server.
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                  {query.trim()
                    ? "No results found."
                    : "Type to search across all pages."}
                </p>
              ) : (
                <ul>
                  {results.map((result) => (
                    <li key={result.url}>
                      <Link
                        href={result.url}
                        onClick={close}
                        className="flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-card"
                      >
                        <FileTextIcon
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium text-foreground">
                            {result.title}
                          </span>
                          <span
                            className="mt-0.5 block truncate text-[12px] leading-5 text-muted-foreground [&_mark]:bg-transparent [&_mark]:font-semibold [&_mark]:text-primary"
                            dangerouslySetInnerHTML={{
                              __html: result.excerpt,
                            }}
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
