"use client";

import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

type FormSettingsBarProps = { isPublished: boolean; isOpen: boolean; responseLimit: number; onOpenChange: (isOpen: boolean) => void };

export function FormSettingsBar({ isPublished, isOpen, responseLimit, onOpenChange }: FormSettingsBarProps) {
  return (
    <section className="space-y-4 border-b p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Form settings</p>
          <p className="text-xs text-muted-foreground">Control access and availability.</p>
        </div>
        <Badge variant={isPublished ? "default" : "secondary"}>
          {isPublished ? "Published" : "Draft"}
        </Badge>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground" htmlFor="limit">
          Response limit
        </Label>
        <Input id="limit" type="number" value={responseLimit} readOnly aria-readonly="true" className="bg-muted" />
        <p className="text-[11px] text-muted-foreground">Set by your workspace plan.</p>
      </div>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>Accept submissions</span>
        <Switch checked={isOpen} onCheckedChange={onOpenChange} />
      </label>
    </section>
  );
}