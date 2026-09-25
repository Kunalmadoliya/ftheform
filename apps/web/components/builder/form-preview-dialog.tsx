"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
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

function PreviewField({ field }: { field: BuilderField }) {
  const [value, setValue] = useState("");
  const inputId = `preview-${field.id}`;

  if (field.type === "textarea") {
    return <Textarea id={inputId} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Type your answer..." />;
  }

  if (field.type === "checkbox") {
    return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value === "true"} onChange={(event) => setValue(String(event.target.checked))} />Yes, I agree</label>;
  }

  if (field.type === "rating") {
    return <div className="flex gap-1" aria-label={`Rating for ${field.label}`}>{[1, 2, 3, 4, 5].map((rating) => <Button key={rating} type="button" variant={value === String(rating) ? "default" : "outline"} size="icon" onClick={() => setValue(String(rating))} aria-label={`${rating} stars`}><Star className="size-4" /></Button>)}</div>;
  }

  return <Input id={inputId} type={field.type === "email" || field.type === "number" || field.type === "date" ? field.type : "text"} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Type your answer..." />;
}

export function FormPreviewDialog({ open, onOpenChange, title, description, fields }: FormPreviewDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{title || "Untitled form"}</DialogTitle><DialogDescription>{description || "Preview how your form will appear to respondents."}</DialogDescription></DialogHeader><div className="space-y-5">{fields.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Add a field to see it in the preview.</div> : fields.map((field, index) => <div key={field.id} className="space-y-2 rounded-lg border p-4"><Label htmlFor={`preview-${field.id}`}><span className="mr-2 text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{field.label}{field.required ? <span className="ml-1 text-destructive">*</span> : null}</Label><PreviewField field={field} /></div>)}{fields.length > 0 ? <Button type="button" className="w-full" disabled><Check />Preview only</Button> : null}</div></DialogContent></Dialog>;
}
