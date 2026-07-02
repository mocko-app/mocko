"use client";

import Link from "next/link";
import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  TrashIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MockDto } from "@/lib/types/mock-dtos";

export const MockActionsMenu: React.FC<{
  mock: MockDto;
  trigger: React.ReactElement;
  onDelete: (mock: MockDto) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onEdit?: (id: string) => void;
}> = ({ mock, trigger, onDelete, onToggleEnabled, onEdit }) => {
  const isReadOnly = mock.annotations.includes("READ_ONLY");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger}>
        <MoreHorizontalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(mock.id)}>
            <PencilIcon aria-hidden="true" />
            {isReadOnly ? "View" : "Edit"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          render={
            <Link href={`/mocks/new?from=${encodeURIComponent(mock.id)}`} />
          }
        >
          <CopyIcon aria-hidden="true" />
          Duplicate
        </DropdownMenuItem>
        {!isReadOnly && (
          <>
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
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
