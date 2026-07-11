"use client";

import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TerminalIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getHosts, getMock, getVersions } from "@/lib/frontend/api";
import { buildMockCurl } from "@/lib/frontend/mock-curl";
import type { MockDto } from "@/lib/types/mock-dtos";

async function copyCurl(mock: MockDto): Promise<void> {
  try {
    const [details, versions, hosts] = await Promise.all([
      getMock(mock.id),
      getVersions(),
      mock.host ? getHosts() : Promise.resolve([]),
    ]);

    const curl = buildMockCurl(details, versions.mockBaseUrl, hosts);
    await navigator.clipboard.writeText(curl);
    toast.success("curl command copied to clipboard.");
  } catch {
    toast.error("Couldn't copy curl command.");
  }
}

export const MockActionsMenu: React.FC<{
  mock: MockDto;
  trigger: React.ReactElement;
  onDelete: (mock: MockDto) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onEdit?: (id: string) => void;
  onDuplicate: () => void;
}> = ({ mock, trigger, onDelete, onToggleEnabled, onEdit, onDuplicate }) => {
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
        <DropdownMenuItem onClick={onDuplicate}>
          <CopyIcon aria-hidden="true" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyCurl(mock)}>
          <TerminalIcon aria-hidden="true" />
          Copy as curl
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
