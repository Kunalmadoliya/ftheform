"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { BuilderField } from "~/components/builder/form-canvas";

type FieldConfig = Record<string, unknown>;
type FieldUpdates = { label: string; required: boolean; config: FieldConfig };
type FieldInspectorProps = { field?: BuilderField; onSave: (updates: FieldUpdates) => Promise<void>; onDelete: () => Promise<void> };

function getConfig(field?: BuilderField): FieldConfig {
  return field?.config && typeof field.config === "object" && !Array.isArray(field.config) ? field.config as FieldConfig : {};
}

export function FieldInspector({ field, onSave, onDelete }: FieldInspectorProps) {
  const [label, setLabel] = useState("");
  const [required, setRequired] = useState(false);
  const [config, setConfig] = useState<FieldConfig>({});
  useEffect(() => { setLabel(field?.label ?? ""); setRequired(field?.required ?? false); setConfig(getConfig(field)); }, [field]);
  if (!field) return <aside className="border-l bg-background p-6 lg:w-72"><p className="text-sm font-medium">Field inspector</p><p className="mt-2 text-sm text-muted-foreground">Select a field to edit its properties.</p></aside>;

  function save(nextConfig = config, nextRequired = required) {
    setConfig(nextConfig);
    void onSave({ label, required: nextRequired, config: nextConfig });
  }
  function setConfigValue(key: string, value: unknown) {
    const nextConfig = { ...config, [key]: value };
    save(nextConfig);
  }
  const options = Array.isArray(config.options) ? config.options.filter((option): option is string => typeof option === "string") : [];

  return <aside className="border-l bg-background p-6 lg:w-80"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Field inspector</p><div className="mt-6 space-y-5"><div className="space-y-2"><Label htmlFor="field-label">Label</Label><Input id="field-label" autoFocus value={label} onChange={(event) => setLabel(event.target.value)} onBlur={() => void onSave({ label, required, config })} /></div><div className="flex items-center justify-between gap-4"><Label htmlFor="required">Required</Label><Switch id="required" checked={required} onCheckedChange={(checked) => { setRequired(checked); save(config, checked); }} /></div>{["text", "textarea", "email"].includes(field.type) ? <div className="space-y-2"><Label htmlFor="field-placeholder">Placeholder</Label><Input id="field-placeholder" value={typeof config.placeholder === "string" ? config.placeholder : ""} onChange={(event) => setConfigValue("placeholder", event.target.value)} placeholder="Optional placeholder" /></div> : null}{field.type === "number" ? <div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label htmlFor="field-min">Min</Label><Input id="field-min" type="number" value={typeof config.min === "number" ? config.min : ""} onChange={(event) => setConfigValue("min", event.target.value ? Number(event.target.value) : undefined)} /></div><div className="space-y-2"><Label htmlFor="field-max">Max</Label><Input id="field-max" type="number" value={typeof config.max === "number" ? config.max : ""} onChange={(event) => setConfigValue("max", event.target.value ? Number(event.target.value) : undefined)} /></div></div> : null}{field.type === "rating" ? <div className="space-y-2"><Label htmlFor="max-stars">Maximum stars</Label><Input id="max-stars" type="number" min={1} max={10} value={typeof config.maxStars === "number" ? config.maxStars : 5} onChange={(event) => setConfigValue("maxStars", Math.max(1, Math.min(10, Number(event.target.value) || 5)))} /></div> : null}{field.type === "date" ? <div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label htmlFor="min-date">Min date</Label><Input id="min-date" type="date" value={typeof config.minDate === "string" ? config.minDate : ""} onChange={(event) => setConfigValue("minDate", event.target.value || undefined)} /></div><div className="space-y-2"><Label htmlFor="max-date">Max date</Label><Input id="max-date" type="date" value={typeof config.maxDate === "string" ? config.maxDate : ""} onChange={(event) => setConfigValue("maxDate", event.target.value || undefined)} /></div></div> : null}{field.type === "select" || field.type === "multiselect" ? <div className="space-y-3"><div className="flex items-center justify-between"><Label>Options</Label><Button type="button" variant="outline" size="sm" onClick={() => setConfigValue("options", [...options, `Option ${options.length + 1}`])}><Plus />Add</Button></div>{options.map((option, index) => <div key={`${field.id}-option-${index}`} className="flex items-center gap-1"><Input aria-label={`Option ${index + 1}`} value={option} onChange={(event) => { const next = [...options]; next[index] = event.target.value; setConfigValue("options", next); }} /><Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => { const next = [...options]; [next[index - 1], next[index]] = [next[index]!, next[index - 1]!]; setConfigValue("options", next); }} aria-label="Move option up"><ArrowUp /></Button><Button type="button" variant="ghost" size="icon" disabled={index === options.length - 1} onClick={() => { const next = [...options]; [next[index], next[index + 1]] = [next[index + 1]!, next[index]!]; setConfigValue("options", next); }} aria-label="Move option down"><ArrowDown /></Button><Button type="button" variant="ghost" size="icon" onClick={() => setConfigValue("options", options.filter((_, optionIndex) => optionIndex !== index))} aria-label={`Remove option ${index + 1}`}><Trash2 /></Button></div>)}</div> : null}<div className="rounded-md bg-muted p-3 text-xs text-muted-foreground"><p className="font-medium text-foreground">{field.type}</p><p className="mt-1">{field.category} field</p></div><Button variant="destructive" className="w-full" onClick={() => void onDelete()}>Delete field</Button></div></aside>;
}
