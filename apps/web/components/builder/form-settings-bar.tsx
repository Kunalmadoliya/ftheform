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
  accessPolicy: "anonymous_and_authenticated" | "anonymous_only" | "authenticated_only";
  allowMultipleSubmissions: boolean;
  canEditResponseLimit: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onResponseLimitSave: (responseLimit: number) => void;
  onAccessPolicyChange: (policy: FormSettingsBarProps["accessPolicy"]) => void;
  onMultipleSubmissionsChange: (allowed: boolean) => void;
};

export function FormSettingsBar({
  isPublished,
  isOpen,
  responseLimit,
  accessPolicy,
  allowMultipleSubmissions,
  canEditResponseLimit,
  onOpenChange,
  onResponseLimitSave,
  onAccessPolicyChange,
  onMultipleSubmissionsChange,
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
    <div className="space-y-5 p-4 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Configuration
          </span>
          <h3 className="mt-0.5 text-sm font-semibold text-foreground">Form settings</h3>
        </div>
        <Badge
          variant={isPublished ? "default" : "secondary"}
          className="font-mono text-[10px] uppercase"
        >
          {isPublished ? "Published" : "Draft"}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Availability Switch */}
        <div className="flex items-center justify-between rounded-[var(--radius)] border border-border p-2.5">
          <div>
            <Label htmlFor="accept-submissions" className="text-xs font-medium cursor-pointer">
              Accept submissions
            </Label>
            <p className="text-[10px] text-muted-foreground">Open or pause response intake</p>
          </div>
          <Switch
            id="accept-submissions"
            checked={isOpen}
            onCheckedChange={onOpenChange}
          />
        </div>

        {/* Response Limit */}
        <div className="space-y-1.5">
          <Label htmlFor="response-limit" className="text-xs font-medium">
            Response limit
          </Label>
          <Input
            id="response-limit"
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
            className={`text-xs ${!canEditResponseLimit ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}`}
          />
          <p className="text-[10px] text-muted-foreground">
            {canEditResponseLimit
              ? "Max submissions before the form automatically closes."
              : "Set by your workspace administrator."}
          </p>
        </div>

        {/* Access Policy Fieldset */}
        <fieldset className="space-y-2 rounded-[var(--radius)] border border-border p-3">
          <legend className="px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Access policy
          </legend>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="radio"
              name="form-access-policy"
              value="anonymous_and_authenticated"
              checked={accessPolicy === "anonymous_and_authenticated"}
              onChange={() => onAccessPolicyChange("anonymous_and_authenticated")}
              className="mt-0.5 accent-foreground"
            />
            <span className="min-w-0">
              <span className="block text-xs font-medium text-foreground">Anyone</span>
              <span className="block text-[10px] text-muted-foreground">
                Anonymous and signed-in respondents can respond.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="radio"
              name="form-access-policy"
              value="anonymous_only"
              checked={accessPolicy === "anonymous_only"}
              onChange={() => onAccessPolicyChange("anonymous_only")}
              className="mt-0.5 accent-foreground"
            />
            <span className="min-w-0">
              <span className="block text-xs font-medium text-foreground">Anonymous only</span>
              <span className="block text-[10px] text-muted-foreground">
                Respondents must be signed out to submit.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="radio"
              name="form-access-policy"
              value="authenticated_only"
              checked={accessPolicy === "authenticated_only"}
              onChange={() => onAccessPolicyChange("authenticated_only")}
              className="mt-0.5 accent-foreground"
            />
            <span className="min-w-0">
              <span className="block text-xs font-medium text-foreground">Sign-in required</span>
              <span className="block text-[10px] text-muted-foreground">
                Respondents must sign in before accessing the form.
              </span>
            </span>
          </label>
        </fieldset>

        {/* Multiple Submissions */}
        <div className="flex items-start gap-2.5 rounded-[var(--radius)] border border-border p-2.5">
          <input
            id="multiple-submissions"
            type="checkbox"
            checked={allowMultipleSubmissions}
            onChange={(event) => onMultipleSubmissionsChange(event.target.checked)}
            className="mt-0.5 accent-foreground"
          />
          <label htmlFor="multiple-submissions" className="cursor-pointer">
            <span className="block text-xs font-medium text-foreground">
              Allow multiple submissions
            </span>
            <span className="block text-[10px] text-muted-foreground">
              Same recognized respondent can submit again.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}