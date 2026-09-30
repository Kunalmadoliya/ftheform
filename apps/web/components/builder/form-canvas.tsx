"use client";

import { useState } from "react";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
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
  const [detailsOpen, setDetailsOpen] = useState(!title.trim());

  return (
    <section className="min-w-0 flex-1 bg-muted/30 p-6 lg:p-10">
      <div className="mx-auto max-w-3xl">
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="mb-8 border-b pb-5">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="px-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Build the form
              </p>
              <Input
                className="mt-1 h-12 rounded-xl border-transparent bg-transparent px-2 text-lg font-semibold shadow-none focus-visible:border-input"
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                onBlur={onTitleSave}
                aria-label="Form title"
                placeholder="Untitled form"
              />
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                {detailsOpen ? "Hide description" : "Add description"}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="pt-3">
            <Textarea
              className="min-h-20 rounded-xl bg-background/60 text-sm"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              onBlur={onDescriptionSave}
              aria-label="Form description"
              placeholder="Add a short description for your audience"
            />
          </CollapsibleContent>
        </Collapsible>
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
