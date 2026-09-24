"use client";

import { GripVertical, Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export type BuilderField = { id: string; type: string; category: string; label: string; required: boolean; config?: unknown; fieldOrder: number };

type FormCanvasProps = { fields: BuilderField[]; selectedFieldId?: string; onSelect: (field: BuilderField) => void; onAdd: () => void };

export function FormCanvas({ fields, selectedFieldId, onSelect, onAdd }: FormCanvasProps) {
  return <section className="min-w-0 flex-1 bg-muted/30 p-6 lg:p-10"><div className="mx-auto max-w-2xl space-y-4"><div><p className="text-sm text-muted-foreground">Form preview</p><h1 className="mt-1 text-2xl font-semibold">Build your form</h1><p className="mt-2 text-sm text-muted-foreground">Add fields and shape the questions your audience will answer.</p></div>{fields.length === 0 ? <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><Plus className="mb-4 size-8 text-muted-foreground" /><p className="font-medium">Your form is empty</p><p className="mt-2 text-sm text-muted-foreground">Choose a field type to start building.</p></CardContent></Card> : fields.map((field) => <Button key={field.id} variant="ghost" className={`h-auto w-full justify-start p-0 text-left ${selectedFieldId === field.id ? "ring-2 ring-ring" : ""}`} onClick={() => onSelect(field)}><Card className="w-full"><CardContent className="flex items-start gap-3 p-5"><GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span className="min-w-0"><span className="block font-medium">{field.label}</span><span className="mt-1 block text-xs text-muted-foreground">{field.type}{field.required ? " - Required" : " - Optional"}</span></span></CardContent></Card></Button>)}<Button variant="outline" className="w-full" onClick={onAdd}><Plus />Add field</Button></div></section>;
}