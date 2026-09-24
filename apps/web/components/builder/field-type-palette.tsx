"use client";

import { CalendarDays, CheckSquare, ChevronDown, Hash, Mail, ListChecks, Star, Text, Type } from "lucide-react";

import { FieldTypeItem, type FieldTypeDefinition } from "~/components/builder/field-type-item";

// No field registry exists in the current backend, so these use the generic field contract it accepts.
export const fieldTypes: FieldTypeDefinition[] = [
  { type: "text", label: "Short text", description: "One-line answer", icon: Type },
  { type: "textarea", label: "Long text", description: "Multi-line answer", icon: Text },
  { type: "email", label: "Email", description: "Validated email address", icon: Mail },
  { type: "number", label: "Number", description: "Numeric answer", icon: Hash },
  { type: "select", label: "Select", description: "Pick one option", icon: ChevronDown },
  { type: "multiselect", label: "Multi select", description: "Pick multiple options", icon: ListChecks },
  { type: "checkbox", label: "Checkbox", description: "Yes or no", icon: CheckSquare },
  { type: "rating", label: "Rating", description: "Star rating scale", icon: Star },
  { type: "date", label: "Date", description: "Date picker", icon: CalendarDays },
];

type FieldTypePaletteProps = { onAdd: (definition: FieldTypeDefinition) => void };

export function FieldTypePalette({ onAdd }: FieldTypePaletteProps) {
  return <aside className="border-r bg-background p-4 lg:w-64"><h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Field types</h2><div className="grid gap-2">{fieldTypes.map((definition) => <FieldTypeItem key={definition.type} definition={definition} onAdd={onAdd} />)}</div></aside>;
}