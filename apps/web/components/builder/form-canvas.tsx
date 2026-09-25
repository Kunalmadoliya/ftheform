"use client";

import { GripVertical, Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

export type BuilderField = { id: string; type: string; category: string; label: string; required: boolean; config?: unknown; fieldOrder: number };

type FormCanvasProps = { fields: BuilderField[]; selectedFieldId?: string; title: string; description: string; onTitleChange: (title: string) => void; onTitleSave: () => void; onDescriptionChange: (description: string) => void; onDescriptionSave: () => void; onSelect: (field: BuilderField) => void; onAdd: () => void };

export function FormCanvas({ fields, selectedFieldId, title, description, onTitleChange, onTitleSave, onDescriptionChange, onDescriptionSave, onSelect, onAdd }: FormCanvasProps) {
  return <section className="min-w-0 flex-1 bg-muted/30 p-6 lg:p-10"><div className="mx-auto max-w-2xl space-y-6"><div className="space-y-3"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Build the form</p><Input className="h-auto border-transparent bg-transparent px-0 text-3xl font-semibold shadow-none focus-visible:border-input focus-visible:ring-0" value={title} onChange={(event) => onTitleChange(event.target.value)} onBlur={onTitleSave} aria-label="Form title" placeholder="Untitled form" /><Textarea className="min-h-20 resize-none border-transparent bg-transparent px-0 text-base shadow-none focus-visible:border-input focus-visible:ring-0" value={description} onChange={(event) => onDescriptionChange(event.target.value)} onBlur={onDescriptionSave} aria-label="Form description" placeholder="Add a short description for your audience" /></div>{fields.length === 0 ? <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><Plus className="mb-4 size-8 text-muted-foreground" /><p className="font-medium">Your form is empty</p><p className="mt-2 text-sm text-muted-foreground">Choose a field type to start building.</p></CardContent></Card> : fields.map((field) => <Button key={field.id} variant="ghost" className={`h-auto w-full justify-start p-0 text-left ${selectedFieldId === field.id ? "ring-2 ring-ring" : ""}`} onClick={() => onSelect(field)}><Card className="w-full"><CardContent className="flex items-start gap-3 p-5"><GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span className="min-w-0"><span className="block font-medium">{field.label}</span><span className="mt-1 block text-xs text-muted-foreground">{field.type}{field.required ? " - Required" : " - Optional"}</span></span></CardContent></Card></Button>)}<Button variant="outline" className="w-full" onClick={onAdd}><Plus />Add field</Button></div></section>;
}