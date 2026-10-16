"use client";

import { IconCheck } from "~/components/icons/app-icons";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { StarRating } from "~/components/forms/star-rating";

export type FormField = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  config?: unknown;
};

export function getOptions(config: unknown): string[] {
  if (!config || typeof config !== "object" || Array.isArray(config)) return [];
  const options = (config as { options?: unknown }).options;
  return Array.isArray(options)
    ? options.filter((option): option is string => typeof option === "string")
    : [];
}

type QuestionScreenProps = {
  field: FormField;
  index: number;
  total: number;
  value: unknown;
  error?: string | null;
  direction?: "forward" | "backward";
  disabled?: boolean;
  onChange: (value: unknown) => void;
};

export function QuestionScreen({
  field,
  index,
  total,
  value,
  error,
  direction = "forward",
  disabled = false,
  onChange,
}: QuestionScreenProps) {
  const options = getOptions(field.config);
  const rawConfig = field.config && typeof field.config === "object" && !Array.isArray(field.config)
    ? (field.config as Record<string, unknown>)
    : {};

  const placeholder = typeof rawConfig.placeholder === "string" ? rawConfig.placeholder : undefined;
  const min = typeof rawConfig.min === "number" ? rawConfig.min : undefined;
  const max = typeof rawConfig.max === "number" ? rawConfig.max : undefined;
  const minDate = typeof rawConfig.minDate === "string" ? rawConfig.minDate : undefined;
  const maxDate = typeof rawConfig.maxDate === "string" ? rawConfig.maxDate : undefined;
  const maxStars = typeof rawConfig.maxStars === "number" ? rawConfig.maxStars : 5;

  const animationClass =
    direction === "forward"
      ? "animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none motion-reduce:transform-none"
      : "animate-in fade-in slide-in-from-top-4 duration-300 motion-reduce:animate-none motion-reduce:transform-none";

  return (
    <div className={`space-y-6 ${animationClass}`}>
      <div className="space-y-2">
        <span className="font-mono text-xs text-muted-foreground">
          Question {index} of {total}
        </span>
        <label
          htmlFor={field.id}
          className="block text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          {field.label}
          {field.required ? (
            <span className="ml-1 text-muted-foreground/60" title="Required">
              *
            </span>
          ) : null}
        </label>
      </div>

      <div className="pt-2">
        {field.type === "textarea" ? (
          <Textarea
            id={field.id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Type your answer here..."}
            disabled={disabled}
            rows={4}
            className="w-full resize-none text-sm leading-relaxed"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${field.id}-error` : undefined}
            autoFocus
          />
        ) : field.type === "checkbox" ? (
          <button
            type="button"
            id={field.id}
            role="checkbox"
            aria-checked={value === true}
            disabled={disabled}
            onClick={() => onChange(value !== true)}
            className={`flex w-full items-center gap-3.5 rounded-[var(--radius)] border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
              value === true
                ? "border-foreground bg-muted/40 text-foreground"
                : "border-border/80 bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            <div
              className={`flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                value === true
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background"
              }`}
            >
              {value === true ? <IconCheck className="size-3.5" /> : null}
            </div>
            <span className="text-sm font-medium text-foreground">{field.label}</span>
          </button>
        ) : field.type === "select" ? (
          <div
            className="space-y-2.5"
            role="radiogroup"
            aria-label={field.label}
            id={field.id}
          >
            {options.map((option, optIdx) => {
              const isSelected = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={disabled}
                  onClick={() => onChange(option)}
                  className={`flex w-full items-center justify-between rounded-[var(--radius)] border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                    isSelected
                      ? "border-foreground bg-muted/40 text-foreground"
                      : "border-border/80 bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-5 items-center justify-center rounded-full border border-border text-[10px] font-mono font-medium text-muted-foreground">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-sm font-medium text-foreground">{option}</span>
                  </div>
                  <div
                    className={`flex size-4 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? "border-foreground bg-foreground"
                        : "border-border bg-transparent"
                    }`}
                  >
                    {isSelected ? <div className="size-1.5 rounded-full bg-background" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : field.type === "multiselect" ? (
          <div
            className="space-y-2.5"
            role="group"
            aria-label={field.label}
            id={field.id}
          >
            {options.map((option, optIdx) => {
              const selectedList = Array.isArray(value) ? (value as string[]) : [];
              const isSelected = selectedList.includes(option);
              const toggleOption = () => {
                if (isSelected) {
                  onChange(selectedList.filter((item) => item !== option));
                } else {
                  onChange([...selectedList, option]);
                }
              };

              return (
                <button
                  key={option}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  disabled={disabled}
                  onClick={toggleOption}
                  className={`flex w-full items-center justify-between rounded-[var(--radius)] border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                    isSelected
                      ? "border-foreground bg-muted/40 text-foreground"
                      : "border-border/80 bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-5 items-center justify-center rounded-full border border-border text-[10px] font-mono font-medium text-muted-foreground">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-sm font-medium text-foreground">{option}</span>
                  </div>
                  <div
                    className={`flex size-4 items-center justify-center rounded-sm border transition-colors ${
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-transparent"
                    }`}
                  >
                    {isSelected ? <IconCheck className="size-3" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : field.type === "rating" ? (
          <StarRating
            label={field.label}
            maxStars={maxStars}
            value={typeof value === "number" ? value : undefined}
            onChange={(rating) => onChange(rating)}
            disabled={disabled}
          />
        ) : (
          <Input
            id={field.id}
            type={
              field.type === "email" || field.type === "number" || field.type === "date"
                ? field.type
                : "text"
            }
            min={min}
            max={max}
            placeholder={placeholder}
            value={value == null ? "" : String(value)}
            disabled={disabled}
            onChange={(e) => {
              if (field.type === "number") {
                onChange(e.target.value !== "" ? Number(e.target.value) : "");
              } else {
                onChange(e.target.value);
              }
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${field.id}-error` : undefined}
            autoFocus
            className="w-full text-sm"
          />
        )}

        {error ? (
          <p
            id={`${field.id}-error`}
            role="alert"
            aria-live="polite"
            className="mt-2.5 text-xs font-medium text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

type IntroScreenProps = {
  title: string;
  description?: string | null;
  totalQuestions: number;
  onStart: () => void;
};

export function IntroScreen({
  title,
  description,
  totalQuestions,
  onStart,
}: IntroScreenProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none motion-reduce:transform-none">
      <div className="space-y-3">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          {totalQuestions} {totalQuestions === 1 ? "question" : "questions"}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
