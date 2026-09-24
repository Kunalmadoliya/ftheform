"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import type { BuilderField } from "~/components/builder/form-canvas";

type FieldInspectorProps = { field?: BuilderField; onSave: (updates: { label: string; required: boolean }) => Promise<void>; onDelete: () => Promise<void> };

export function FieldInspector({ field, onSave, onDelete }: FieldInspectorProps) {
  const [label, setLabel] = useState("");
  const [required, setRequired] = useState(false);
  useEffect(() => { setLabel(field?.label ?? ""); setRequired(field?.required ?? false); }, [field]);
  if (!field) return <aside className="border-l bg-background p-6 lg:w-72"><p className="text-sm font-medium">Field inspector</p><p className="mt-2 text-sm text-muted-foreground">Select a field to edit its properties.</p></aside>;
  return <aside className="border-l bg-background p-6 lg:w-72"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Field inspector</p><div className="mt-6 space-y-5"><div className="space-y-2"><Label htmlFor="field-label">Label</Label><Input id="field-label" value={label} onChange={(event) => setLabel(event.target.value)} onBlur={() => void onSave({ label, required })} /></div><div className="flex items-center justify-between gap-4"><Label htmlFor="required">Required</Label><Switch id="required" checked={required} onCheckedChange={(checked) => { setRequired(checked); void onSave({ label, required: checked }); }} /></div><div className="rounded-md bg-muted p-3 text-xs text-muted-foreground"><p className="font-medium text-foreground">{field.type}</p><p className="mt-1">{field.category} field</p></div><Button variant="destructive" className="w-full" onClick={() => void onDelete()}>Delete field</Button></div></aside>;
}