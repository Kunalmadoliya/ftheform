"use client";

import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

export type BuilderField = {
  id: string;
  type: string;
  category: string;
  label: string;
  required: boolean;
  config?: unknown;
  fieldOrder: number;
};
type FormCanvasProps = {
  fields: BuilderField[];
  selectedFieldId?: string;
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onTitleSave: () => void;
  onDescriptionChange: (description: string) => void;
  onDescriptionSave: () => void;
  onSelect: (field: BuilderField) => void;
  onEdit: (field: BuilderField) => void;
  onDelete: (field: BuilderField) => void;
  onAdd: () => void;
};

export function FormCanvas({
  fields,
  selectedFieldId,
  title,
  description,
  onTitleChange,
  onTitleSave,
  onDescriptionChange,
  onDescriptionSave,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
}: FormCanvasProps) {
  return (
    <section className="min-w-0 flex-1 bg-muted/30 p-6 lg:p-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 min-h-32 space-y-3 border-b pb-5">
          <p className="text-lg font-medium uppercase px-2 tracking-wider text-muted-foreground">
            Build the form
          </p>
          <Input
             className="!text-lg !h-18 bg-transparent rounded-xl font-semibold"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={onTitleSave}
            aria-label="Form title"
            placeholder="Untitled form"
          />
          <Textarea
             className="!text-sm !h-20 bg-transparent rounded-xl font-normal"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            onBlur={onDescriptionSave}
            aria-label="Form description"
            placeholder="Add a short description for your audience"
          />
        </div>
        <div className="space-y-3">
          {fields.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex min-h-32 flex-col items-center justify-center text-center">
                <Plus className="mb-3 size-7 text-muted-foreground" />
                <p className="text-base font-medium">Your form is empty</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a field type to start building.
                </p>
              </CardContent>
            </Card>
          ) : (
            fields.map((field) => (
              <Card
                key={field.id}
                className={`w-full cursor-pointer ${selectedFieldId === field.id ? "ring-2 ring-ring" : ""}`}
                onClick={() => onSelect(field)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <GripVertical className="size-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium">{field.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {field.type}
                      {field.required ? " - Required" : " - Optional"}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(field);
                      }}
                      aria-label={`Edit ${field.label}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(field);
                      }}
                      aria-label={`Delete ${field.label}`}
                    >
                      <Trash2 />
                    </Button>
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <Button type="button" variant="outline" className="mt-4 w-full" onClick={onAdd}>
          <Plus />
          Add field
        </Button>
      </div>
    </section>
  );
}
