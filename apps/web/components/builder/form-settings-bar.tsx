"use client";

import { useEffect, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

type FormSettingsBarProps = {
  isPublished: boolean;
  isOpen: boolean;
  responseLimit: number;
  canEditResponseLimit: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onResponseLimitSave: (responseLimit: number) => void;
};

export function FormSettingsBar({
  isPublished,
  isOpen,
  responseLimit,
  canEditResponseLimit,
  onOpenChange,
  onResponseLimitSave,
}: FormSettingsBarProps) {
  const [responseLimitDraft, setResponseLimitDraft] = useState(String(responseLimit));
  useEffect(() => setResponseLimitDraft(String(responseLimit)), [responseLimit]);

  function saveResponseLimit() {
    const parsedLimit = Number(responseLimitDraft);
    if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
      onResponseLimitSave(parsedLimit);
    } else {
      setResponseLimitDraft(String(responseLimit));
    }
  }

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
        <Input
          id="limit"
          type="number"
          min={1}
          value={responseLimitDraft}
          onChange={(event) => setResponseLimitDraft(event.target.value)}
          onBlur={saveResponseLimit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          readOnly={!canEditResponseLimit}
          aria-readonly={!canEditResponseLimit}
          className={!canEditResponseLimit ? "bg-muted" : undefined}
        />
        <p className="text-[11px] text-muted-foreground">
          {canEditResponseLimit ? "Available responses before submissions close." : "Set by your workspace administrator."}
        </p>
      </div>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>Accept submissions</span>
        <Switch checked={isOpen} onCheckedChange={onOpenChange} />
      </label>
    </section>
  );
}