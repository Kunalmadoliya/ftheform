"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

export type FieldTypeDefinition = {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type FieldTypeItemProps = {
  definition: FieldTypeDefinition;
  onAdd: (definition: FieldTypeDefinition) => void;
};

export function FieldTypeItem({ definition, onAdd }: FieldTypeItemProps) {
  const Icon = definition.icon;
  return (
    <Button
      variant="outline"
      className="h-auto w-full justify-start gap-2.5 p-2.5 text-left border-border/80 bg-card hover:bg-muted/60 transition-colors"
      onClick={() => onAdd(definition)}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-[calc(var(--radius)-2px)] border border-border/60 bg-muted text-foreground">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-foreground">{definition.label}</span>
        <span className="block truncate font-mono text-[10px] text-muted-foreground">
          {definition.description}
        </span>
      </span>
    </Button>
  );
}