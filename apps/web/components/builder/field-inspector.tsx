"use client";

import { useEffect, useState } from "react";
import {
  IconArrowDown,
  IconArrowUp,
  IconCreate,
  IconDelete,
  fieldTypeIcons,
} from "~/components/icons/app-icons";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import type { BuilderField } from "~/components/builder/form-canvas";

type FieldConfig = Record<string, unknown>;
type FieldUpdates = { label: string; required: boolean; config: FieldConfig };
type FieldInspectorProps = {
  field?: BuilderField;
  onSave: (updates: FieldUpdates) => Promise<void>;
  onDelete: () => void | Promise<void>;
};

function getConfig(field?: BuilderField): FieldConfig {
  return field?.config && typeof field.config === "object" && !Array.isArray(field.config)
    ? (field.config as FieldConfig)
    : {};
}

export function FieldInspector({ field, onSave, onDelete }: FieldInspectorProps) {
  const [label, setLabel] = useState("");
  const [required, setRequired] = useState(false);
  const [config, setConfig] = useState<FieldConfig>({});

  useEffect(() => {
    setLabel(field?.label ?? "");
    setRequired(field?.required ?? false);
    setConfig(getConfig(field));
  }, [field]);

  if (!field) {
    return (
      <div className="p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Field inspector
        </p>
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
          Select a field on the canvas to configure its label, validation, and options.
        </p>
      </div>
    );
  }

  function save(nextConfig = config, nextRequired = required) {
    setConfig(nextConfig);
    void onSave({ label, required: nextRequired, config: nextConfig });
  }

  function setConfigValue(key: string, value: unknown) {
    const nextConfig = { ...config, [key]: value };
    save(nextConfig);
  }

  const options = Array.isArray(config.options)
    ? config.options.filter((option): option is string => typeof option === "string")
    : [];

  return (
    <div className="space-y-5 p-4 text-xs">
      <div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {(() => {
            const FieldIcon = fieldTypeIcons[field.type];
            return FieldIcon ? <FieldIcon className="size-3" /> : null;
          })()}
          <span>Properties</span>
        </div>
        <h3 className="mt-0.5 text-sm font-semibold text-foreground">{field.label || "Untitled"}</h3>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div className="space-y-1.5">
          <Label htmlFor="field-label" className="text-xs font-medium">
            Label
          </Label>
          <Input
            id="field-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            onBlur={() => void onSave({ label, required, config })}
            className="text-xs"
          />
        </div>

        {/* Required Switch */}
        <div className="flex items-center justify-between rounded-[var(--radius)] border border-border p-2.5">
          <div>
            <Label htmlFor="field-required" className="text-xs font-medium cursor-pointer">
              Required field
            </Label>
            <p className="text-[10px] text-muted-foreground">Respondents must answer</p>
          </div>
          <Switch
            id="field-required"
            checked={required}
            onCheckedChange={(checked) => {
              setRequired(checked);
              save(config, checked);
            }}
          />
        </div>

        {/* Placeholder */}
        {["text", "textarea", "email"].includes(field.type) ? (
          <div className="space-y-1.5">
            <Label htmlFor="field-placeholder" className="text-xs font-medium">
              Placeholder
            </Label>
            <Input
              id="field-placeholder"
              value={typeof config.placeholder === "string" ? config.placeholder : ""}
              onChange={(event) => setConfigValue("placeholder", event.target.value)}
              placeholder="Optional placeholder..."
              className="text-xs"
            />
          </div>
        ) : null}

        {/* Number min / max */}
        {field.type === "number" ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="field-min" className="text-xs font-medium">
                Min value
              </Label>
              <Input
                id="field-min"
                type="number"
                value={typeof config.min === "number" ? config.min : ""}
                onChange={(event) =>
                  setConfigValue(
                    "min",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="field-max" className="text-xs font-medium">
                Max value
              </Label>
              <Input
                id="field-max"
                type="number"
                value={typeof config.max === "number" ? config.max : ""}
                onChange={(event) =>
                  setConfigValue(
                    "max",
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
                className="text-xs"
              />
            </div>
          </div>
        ) : null}

        {/* Rating maxStars */}
        {field.type === "rating" ? (
          <div className="space-y-1.5">
            <Label htmlFor="max-stars" className="text-xs font-medium">
              Maximum stars
            </Label>
            <Input
              id="max-stars"
              type="number"
              min={1}
              max={10}
              step={1}
              value={typeof config.maxStars === "number" ? config.maxStars : 5}
              onChange={(event) =>
                setConfigValue(
                  "maxStars",
                  Math.max(1, Math.min(10, Math.trunc(Number(event.target.value)) || 5)),
                )
              }
              className="text-xs"
            />
          </div>
        ) : null}

        {/* Date min / max */}
        {field.type === "date" ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="min-date" className="text-xs font-medium">
                Min date
              </Label>
              <Input
                id="min-date"
                type="date"
                value={typeof config.minDate === "string" ? config.minDate : ""}
                onChange={(event) => setConfigValue("minDate", event.target.value || undefined)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max-date" className="text-xs font-medium">
                Max date
              </Label>
              <Input
                id="max-date"
                type="date"
                value={typeof config.maxDate === "string" ? config.maxDate : ""}
                onChange={(event) => setConfigValue("maxDate", event.target.value || undefined)}
                className="text-xs"
              />
            </div>
          </div>
        ) : null}

        {/* Options for Select / Multiselect */}
        {field.type === "select" || field.type === "multiselect" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Options</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() =>
                  setConfigValue("options", [...options, `Option ${options.length + 1}`])
                }
              >
                <IconCreate className="size-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-1.5">
              {options.map((option, index) => (
                <div key={`${field.id}-option-${index}`} className="flex items-center gap-1">
                  <Input
                    aria-label={`Option ${index + 1}`}
                    value={option}
                    onChange={(event) => {
                      const next = [...options];
                      next[index] = event.target.value;
                      setConfigValue("options", next);
                    }}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === 0}
                    onClick={() => {
                      const next = [...options];
                      [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
                      setConfigValue("options", next);
                    }}
                    aria-label="Move option up"
                  >
                    <IconArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === options.length - 1}
                    onClick={() => {
                      const next = [...options];
                      [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
                      setConfigValue("options", next);
                    }}
                    aria-label="Move option down"
                  >
                    <IconArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setConfigValue(
                        "options",
                        options.filter((_, optionIndex) => optionIndex !== index),
                      )
                    }
                    aria-label={`Remove option ${index + 1}`}
                  >
                    <IconDelete className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Type Info Badge */}
        <div className="rounded-[var(--radius)] border border-border/80 bg-muted/40 p-2.5 font-mono text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground uppercase">{field.type}</span> • {field.category}
        </div>

        {/* Delete Action */}
        <div className="pt-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full text-xs"
            onClick={() => void onDelete()}
          >
            <IconDelete className="size-3.5 mr-1.5" />
            Delete field
          </Button>
        </div>
      </div>
    </div>
  );
}
