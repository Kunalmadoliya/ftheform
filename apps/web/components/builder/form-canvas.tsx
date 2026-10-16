"use client";

import { useRef, useState, type DragEvent } from "react";
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";

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
  onMove: (field: BuilderField, direction: -1 | 1) => void;
  onReorder: (orderedFieldIds: string[]) => void;
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
  onMove,
  onReorder,
  onAdd,
}: FormCanvasProps) {
  const [detailsOpen, setDetailsOpen] = useState(!title.trim() || Boolean(description.trim()));
  const draggedFieldId = useRef<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  function handleDrop(event: DragEvent<HTMLDivElement>, targetFieldId: string) {
    event.preventDefault();
    const sourceFieldId = draggedFieldId.current ?? event.dataTransfer.getData("text/plain");
    draggedFieldId.current = null;
    setDropTargetId(null);
    if (!sourceFieldId || sourceFieldId === targetFieldId) return;

    const orderedFields = [...fields];
    const sourceIndex = orderedFields.findIndex((field) => field.id === sourceFieldId);
    const targetIndex = orderedFields.findIndex((field) => field.id === targetFieldId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [draggedField] = orderedFields.splice(sourceIndex, 1);
    if (!draggedField) return;
    orderedFields.splice(targetIndex, 0, draggedField);
    onReorder(orderedFields.map((field) => field.id));
  }

  return (
    <section className="min-w-0 flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Form Meta Header */}
        <Collapsible
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          className="mb-6 rounded-[var(--radius)] border border-border bg-card p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Form Overview
              </span>
              <Input
                className="mt-1 h-9 rounded-md border-transparent bg-transparent px-1 text-base font-semibold shadow-none transition-colors hover:border-border/60 focus-visible:border-border sm:text-lg"
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                onBlur={onTitleSave}
                aria-label="Form title"
                placeholder="Untitled form"
              />
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                {detailsOpen ? "Hide description" : "Add description"}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="pt-3">
            <Textarea
              className="min-h-16 resize-none rounded-md border-border/80 bg-background/60 text-xs leading-relaxed"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              onBlur={onDescriptionSave}
              aria-label="Form description"
              placeholder="Add instructions or description for your respondents..."
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Fields List */}
        <div className="space-y-2.5">
          {fields.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-border bg-card/40 p-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted/60 text-muted-foreground">
                <Plus className="size-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold tracking-tight text-foreground">
                Your form is empty
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Add field types from the left palette, or ask the AI dock at the bottom left to generate
                questions for you.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <Button size="sm" onClick={onAdd} className="h-8 gap-1.5 text-xs">
                  <Plus className="size-3.5" />
                  Add a field
                </Button>
                <div className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <Sparkles className="size-3 text-foreground" />
                  <span>or prompt AI below</span>
                </div>
              </div>
            </div>
          ) : (
            fields.map((field, index) => {
              const isSelected = selectedFieldId === field.id;
              const isDropTarget = dropTargetId === field.id;

              return (
                <Card
                  key={field.id}
                  className={`group relative w-full cursor-pointer transition-colors border ${
                    isSelected
                      ? "border-foreground bg-card shadow-none"
                      : isDropTarget
                        ? "border-foreground/80 bg-muted/30"
                        : "border-border bg-card hover:border-foreground/30"
                  }`}
                  onDragOver={(event) => {
                    if (draggedFieldId.current) event.preventDefault();
                  }}
                  onDragLeave={() =>
                    setDropTargetId((current) => (current === field.id ? null : current))
                  }
                  onDrop={(event) => handleDrop(event, field.id)}
                  onClick={() => onSelect(field)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <span
                      draggable
                      className="flex size-7 shrink-0 cursor-grab items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
                      aria-label={`Drag to reorder ${field.label}`}
                      onDragStart={(event) => {
                        draggedFieldId.current = field.id;
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", field.id);
                      }}
                      onDragEnd={() => {
                        draggedFieldId.current = null;
                        setDropTargetId(null);
                      }}
                      onDragEnter={(event) => {
                        if (draggedFieldId.current && draggedFieldId.current !== field.id) {
                          event.preventDefault();
                          setDropTargetId(field.id);
                        }
                      }}
                    >
                      <GripVertical className="size-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-foreground">
                        {field.label}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                        {field.type}
                        {field.required ? " • Required" : " • Optional"}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        disabled={index === 0}
                        onClick={(event) => {
                          event.stopPropagation();
                          onMove(field, -1);
                        }}
                        aria-label={`Move ${field.label} up`}
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        disabled={index === fields.length - 1}
                        onClick={(event) => {
                          event.stopPropagation();
                          onMove(field, 1);
                        }}
                        aria-label={`Move ${field.label} down`}
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(field);
                        }}
                        aria-label={`Edit ${field.label}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(field);
                        }}
                        aria-label={`Delete ${field.label}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </span>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {fields.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full h-9 border-dashed border-border/80 text-xs font-normal"
            onClick={onAdd}
          >
            <Plus className="size-3.5 mr-1.5" />
            Add field
          </Button>
        ) : null}
      </div>
    </section>
  );
}
