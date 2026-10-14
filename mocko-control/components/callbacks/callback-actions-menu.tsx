"use client";

import {
  LayersIcon,
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
  canFire: boolean;
  onFire: (definition: CallbackDto) => void;
  onDelete: (definition: CallbackDto) => void;
  onEdit?: (id: string) => void;
  onOverride?: (id: string) => void;
}> = ({
  definition,
  trigger,
  canFire,
  onFire,
  onDelete,
  onEdit,
  onOverride,
}) => {
  const isReadOnly = definition.annotations.includes("READ_ONLY");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger}>
        <MoreHorizontalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(definition.id)}>
            <PencilIcon aria-hidden="true" />
            {isReadOnly ? "View" : "Edit"}
          </DropdownMenuItem>
        )}
        {isReadOnly && onOverride && (
          <DropdownMenuItem onClick={() => onOverride(definition.id)}>
            <LayersIcon aria-hidden="true" />
            Override
          </DropdownMenuItem>
        )}
        {canFire && (
          <DropdownMenuItem onClick={() => onFire(definition)}>
            <ZapIcon aria-hidden="true" />
            Fire
          </DropdownMenuItem>
        )}
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
