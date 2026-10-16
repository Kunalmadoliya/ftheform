"use client";

import {
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Hash,
  Mail,
  ListChecks,
  Star,
  Text,
  Type,
} from "lucide-react";

import { FieldTypeItem, type FieldTypeDefinition } from "~/components/builder/field-type-item";

export const fieldTypes: FieldTypeDefinition[] = [
  { type: "text", label: "Short text", description: "One-line answer", icon: Type },
  { type: "textarea", label: "Long text", description: "Multi-line answer", icon: Text },
  { type: "email", label: "Email", description: "Validated email address", icon: Mail },
  { type: "number", label: "Number", description: "Numeric answer", icon: Hash },
  { type: "select", label: "Select", description: "Pick one option", icon: ChevronDown },
  {
    type: "multiselect",
    label: "Multi select",
    description: "Pick multiple options",
    icon: ListChecks,
  },
  { type: "checkbox", label: "Checkbox", description: "Yes or no", icon: CheckSquare },
  { type: "rating", label: "Rating", description: "Star rating scale", icon: Star },
  { type: "date", label: "Date", description: "Date picker", icon: CalendarDays },
];

type FieldTypePaletteProps = {
  onAdd: (definition: FieldTypeDefinition) => void;
};

export function FieldTypePalette({ onAdd }: FieldTypePaletteProps) {
  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="mb-2.5 px-1">
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Field types
        </h2>
      </div>
      <div className="grid gap-1.5">
        {fieldTypes.map((definition) => (
          <FieldTypeItem key={definition.type} definition={definition} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}
