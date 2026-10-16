"use client";

import { fieldTypeIcons } from "~/components/icons/app-icons";
import { FieldTypeItem, type FieldTypeDefinition } from "~/components/builder/field-type-item";

export const fieldTypes: FieldTypeDefinition[] = [
  { type: "text", label: "Short text", description: "One-line answer", icon: fieldTypeIcons.text },
  { type: "textarea", label: "Long text", description: "Multi-line answer", icon: fieldTypeIcons.textarea },
  { type: "email", label: "Email", description: "Validated email address", icon: fieldTypeIcons.email },
  { type: "number", label: "Number", description: "Numeric answer", icon: fieldTypeIcons.number },
  { type: "select", label: "Select", description: "Pick one option", icon: fieldTypeIcons.select },
  {
    type: "multiselect",
    label: "Multi select",
    description: "Pick multiple options",
    icon: fieldTypeIcons.multiselect,
  },
  { type: "checkbox", label: "Checkbox", description: "Yes or no", icon: fieldTypeIcons.checkbox },
  { type: "rating", label: "Rating", description: "Star rating scale", icon: fieldTypeIcons.rating },
  { type: "date", label: "Date", description: "Date picker", icon: fieldTypeIcons.date },
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
