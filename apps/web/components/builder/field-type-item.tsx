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
    <Button variant="outline" className="h-auto justify-start gap-3 p-3 text-left" onClick={() => onAdd(definition)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted"><Icon className="size-4" /></span>
      <span className="min-w-0"><span className="block text-sm font-medium">{definition.label}</span><span className="block truncate text-xs font-normal text-muted-foreground">{definition.description}</span></span>
    </Button>
  );
}