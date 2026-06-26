"use client";

import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type OperationCardProps = {
  icon: React.ReactNode;
  name: string;
  description: string;
  onStart: () => void;
  disabled: boolean;
  badge?: string;
};

export function OperationCard({
  icon,
  name,
  description,
  onStart,
  disabled,
  badge,
}: OperationCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{name}</p>
            {badge && <Badge variant="outline">{badge}</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="shrink-0">
          <Button size="sm" onClick={onStart} disabled={disabled}>
            Start
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
