"use client";

import { useState } from "react";
import { IconCheck, IconPreview } from "~/components/icons/app-icons";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { BuilderField } from "~/components/builder/form-canvas";
import { StarRating } from "~/components/forms/star-rating";

type FormPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: BuilderField[];
};

type FieldConfig = Record<string, unknown>;

function getConfig(field: BuilderField): FieldConfig {
  return field.config && typeof field.config === "object" && !Array.isArray(field.config)
    ? (field.config as FieldConfig)
    : {};
}

function PreviewField({ field }: { field: BuilderField }) {
  const [value, setValue] = useState("");
  const config = getConfig(field);
  const inputId = `preview-${field.id}`;
  const placeholder =
    typeof config.placeholder === "string" ? config.placeholder : "Type your answer...";

  if (field.type === "textarea") {
    return (
      <Textarea
        id={inputId}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="text-xs resize-none min-h-20"
      />
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(event) => setValue(String(event.target.checked))}
          className="accent-foreground"
        />
        <span>Yes, I agree</span>
      </label>
    );
  }

  if (field.type === "select" || field.type === "multiselect") {
    const options = Array.isArray(config.options)
      ? config.options.filter((option): option is string => typeof option === "string")
      : [];
    return (
      <div className="space-y-1.5">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type={field.type === "select" ? "radio" : "checkbox"}
              name={inputId}
              value={option}
              className="accent-foreground"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "rating") {
    const maxStars = typeof config.maxStars === "number" ? config.maxStars : 5;
    return (
      <StarRating
        label={field.label}
        maxStars={maxStars}
        value={value ? Number(value) : undefined}
        onChange={(rating) => setValue(String(rating))}
      />
    );
  }

  const inputType =
    field.type === "email" || field.type === "number" || field.type === "date"
      ? field.type
      : "text";

  return (
    <Input
      id={inputId}
      type={inputType}
      min={
        typeof config.min === "number"
          ? config.min
          : typeof config.minDate === "string"
            ? config.minDate
            : undefined
      }
      max={
        typeof config.max === "number"
          ? config.max
          : typeof config.maxDate === "string"
            ? config.maxDate
            : undefined
      }
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      className="text-xs"
    />
  );
}

export function FormPreviewDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
}: FormPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl p-0">
        <DialogHeader className="border-b border-border bg-muted/30 p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-[var(--radius)] border border-border bg-background text-foreground">
              <IconPreview className="size-3.5" />
            </span>
            <DialogTitle className="text-base font-semibold">{title || "Untitled form"}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {description || "Preview how respondents will see and interact with this form."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {fields.length === 0 ? (
            <div className="rounded-[var(--radius)] border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No fields added yet. Add fields on the canvas to preview them here.
            </div>
          ) : (
            fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-2 rounded-[var(--radius)] border border-border bg-card p-4"
              >
                <Label htmlFor={`preview-${field.id}`} className="text-xs font-medium">
                  <span className="mr-1.5 font-mono text-[10px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {field.label}
                  {field.required ? <span className="ml-1 text-destructive">*</span> : null}
                </Label>
                <PreviewField field={field} />
              </div>
            ))
          )}

          {fields.length > 0 ? (
            <Button
              type="button"
              className="w-full text-xs"
              variant="secondary"
              disabled
            >
              <IconCheck className="size-3.5 mr-1" />
              Preview mode — submissions disabled
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
