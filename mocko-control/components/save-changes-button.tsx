"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SaveChangesButtonProps = {
  label: string;
  pristine: boolean;
  isSubmitting: boolean;
};

export function SaveChangesButton({
  label,
  pristine,
  isSubmitting,
}: SaveChangesButtonProps) {
  if (pristine) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" tabIndex={0} />}>
          <Button type="submit" disabled>
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">All changes saved</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button type="submit" disabled={isSubmitting}>
      {label}
    </Button>
  );
}
