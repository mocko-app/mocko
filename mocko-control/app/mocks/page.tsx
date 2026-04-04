"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/delete-dialog";
import { FIXTURE_MOCKS } from "@/lib/mock/mock.fixtures";
import type { Mock } from "@/lib/types/mock";
import { cn } from "@/lib/utils";

const METHOD_COLORS: Record<Mock["method"], string> = {
  GET: "text-sky-400",
  POST: "text-emerald-500",
  PUT: "text-amber-400",
  PATCH: "text-violet-400",
  DELETE: "text-red-400",
};

interface MockCardProps {
  mock: Mock;
  onEdit: (id: string) => void;
  onDelete: (mock: Mock) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
}

function MockCard({ mock, onEdit, onDelete, onToggleEnabled }: MockCardProps) {
  const isReadOnly = mock.annotations.includes("READ_ONLY");

  return (
    <div
      className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3.5 transition-colors hover:border-[#252528]"
      role="row"
      aria-label={`Mock: ${mock.name}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="text-sm font-medium text-white truncate">
            {mock.name}
          </span>
          {mock.annotations.includes("TEMPORARY") && (
            <Badge variant="annotationTemporary">Temporary</Badge>
          )}
          {isReadOnly && <Badge variant="annotationReadOnly">Read Only</Badge>}
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span
            className={cn(
              METHOD_COLORS[mock.method],
              "tracking-wider shrink-0",
            )}
          >
            {mock.method}
          </span>
          <span className="text-muted-foreground truncate">{mock.path}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {!mock.isEnabled && (
          <div className="flex items-center gap-1.5" aria-label="Disabled">
            <span
              className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs text-red-400 font-medium">off</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-[#444] hover:text-[#888] hover:bg-transparent focus-visible:text-[#888]"
                aria-label={`Actions for ${mock.name}`}
              />
            }
          >
            <MoreHorizontalIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isReadOnly ? (
              <>
                <DropdownMenuItem onClick={() => onEdit(mock.id)}>
                  <PencilIcon aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onToggleEnabled(mock.id, !mock.isEnabled)}
                >
                  {mock.isEnabled ? (
                    <ToggleLeftIcon aria-hidden="true" />
                  ) : (
                    <ToggleRightIcon aria-hidden="true" />
                  )}
                  {mock.isEnabled ? "Disable" : "Enable"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(mock)}
                >
                  <TrashIcon aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => onEdit(mock.id)}>
                <PencilIcon aria-hidden="true" />
                View
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function MocksPage() {
  const router = useRouter();
  const [mocks, setMocks] = useState<Mock[]>(FIXTURE_MOCKS);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Mock | null>(null);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);

  const filtered = mocks.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.path.toLowerCase().includes(q) ||
      m.method.toLowerCase().includes(q)
    );
  });

  const activeCount = mocks.filter((m) => m.isEnabled).length;

  function handleEdit(id: string) {
    router.push(`/mocks/${id}`);
  }

  function handleDelete(mock: Mock) {
    if (skipDeleteConfirm) {
      setMocks((prev) => prev.filter((m) => m.id !== mock.id));
    } else {
      setDeleteTarget(mock);
    }
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      setMocks((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  }

  function handleToggleEnabled(id: string, enabled: boolean) {
    setMocks((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isEnabled: enabled } : m)),
    );
  }

  return (
    <div className="px-8 pt-8 pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Mocks
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {mocks.length} total · {activeCount} active
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/mocks/new" aria-label="Create new mock" />}
        >
          <PlusIcon aria-hidden="true" />
          New mock
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <SearchIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 size-[14px] text-[#444] pointer-events-none"
          aria-hidden="true"
        />
        <Input
          className="max-w-sm pl-9 bg-muted border-input placeholder:text-[#3a3a3a] focus-visible:ring-1 focus-visible:ring-[#444] focus-visible:border-[#444]"
          placeholder="Search mocks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search mocks"
        />
      </div>

      {/* Empty: no search match */}
      {filtered.length === 0 && search && (
        <div
          className="flex flex-col items-center justify-center gap-2 py-16 text-center"
          role="status"
          aria-live="polite"
        >
          <p className="text-muted-foreground text-sm">
            No mocks match &ldquo;{search}&rdquo;
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
            Clear search
          </Button>
        </div>
      )}

      {/* Empty: no mocks at all */}
      {filtered.length === 0 && !search && (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 text-center"
          role="status"
        >
          <p className="text-muted-foreground text-sm">No mocks yet.</p>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/mocks/new" />}
          >
            Create your first mock
          </Button>
        </div>
      )}

      {/* List */}
      {filtered.length > 0 && (
        <div
          className="flex flex-col gap-2"
          role="list"
          aria-label="Mocks list"
        >
          {filtered.map((mock) => (
            <MockCard
              key={mock.id}
              mock={mock}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleEnabled={handleToggleEnabled}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <DeleteDialog
          open={true}
          mockName={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          onDontAskAgain={() => setSkipDeleteConfirm(true)}
        />
      )}
    </div>
  );
}
