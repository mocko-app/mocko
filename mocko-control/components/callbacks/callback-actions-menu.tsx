"use client";

import {
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ZapIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CallbackDto } from "@/lib/types/callback-dtos";

export const CallbackActionsMenu: React.FC<{
  definition: CallbackDto;
  trigger: React.ReactElement;
  onFire: (definition: CallbackDto) => void;
  onDelete: (definition: CallbackDto) => void;
  onEdit?: (slug: string) => void;
}> = ({ definition, trigger, onFire, onDelete, onEdit }) => {
  const isReadOnly = definition.annotations.includes("READ_ONLY");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger}>
        <MoreHorizontalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(definition.slug)}>
            <PencilIcon aria-hidden="true" />
            {isReadOnly ? "View" : "Edit"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onFire(definition)}>
          <ZapIcon aria-hidden="true" />
          Fire
        </DropdownMenuItem>
        {!isReadOnly && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(definition)}
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
