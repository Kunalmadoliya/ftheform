"use client";

import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

type FormSettingsBarProps = { isPublished: boolean; isOpen: boolean; responseLimit: number; onOpenChange: (isOpen: boolean) => void };

export function FormSettingsBar({ isPublished, isOpen, responseLimit, onOpenChange }: FormSettingsBarProps) {
  return <div className="flex flex-wrap items-end gap-4 border-b bg-muted/20 px-6 py-3"><Badge variant={isPublished ? "default" : "secondary"}>{isPublished ? "Published" : "Draft"}</Badge><div className="space-y-1"><Label className="text-xs text-muted-foreground" htmlFor="limit">Response limit</Label><Input id="limit" type="number" value={responseLimit} readOnly aria-readonly="true" className="h-8 w-28 bg-muted" /></div><label className="flex h-8 items-center gap-2 text-sm"><Switch checked={isOpen} onCheckedChange={onOpenChange} />Accept submissions</label></div>;
}