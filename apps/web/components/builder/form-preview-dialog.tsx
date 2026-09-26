"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";

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
  if (field.type === "textarea")
    return (
      <Textarea
        id={inputId}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
      />
    );
  if (field.type === "checkbox")
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(event) => setValue(String(event.target.checked))}
        />
        Yes, I agree
      </label>
    );
  if (field.type === "select" || field.type === "multiselect") {
    const options = Array.isArray(config.options)
      ? config.options.filter((option): option is string => typeof option === "string")
      : [];
    return (
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type={field.type === "select" ? "radio" : "checkbox"}
              name={inputId}
              value={option}
            />
            {option}
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "rating") {
    const maxStars = typeof config.maxStars === "number" ? config.maxStars : 5;
    const rating = Number(value);
    return (
      <div className="flex gap-1" aria-label={`Rating for ${field.label}`}>
        {Array.from({ length: maxStars }, (_, index) => {
          const star = index + 1;
          return (
            <Button
              key={star}
              type="button"
              variant="outline"
              size="icon"
              className={star <= rating ? "text-primary" : "text-muted-foreground"}
              onClick={() => setValue(String(star))}
              aria-label={`${star} stars`}
            >
              <Star className={star <= rating ? "fill-current" : ""} />
            </Button>
          );
        })}
      </div>
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title || "Untitled form"}</DialogTitle>
          <DialogDescription>
            {description || "Preview how your form will appear to respondents."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Add a field to see it in the preview.
            </div>
          ) : (
            fields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-lg border p-4">
                <Label htmlFor={`preview-${field.id}`}>
                  <span className="mr-2 text-xs text-muted-foreground">
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
            <Button type="button" className="w-full" disabled>
              <Check />
              Preview only
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
