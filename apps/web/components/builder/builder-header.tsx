"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Eye,
  Globe2,
  Loader2,
  Plus,
  Send,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ThemeToggle } from "~/components/theme-toggle";

type BuilderHeaderProps = {
  title: string;
  onTitleChange: (title: string) => void;
  onTitleSave: () => void;
  onPreview: () => void;
  onShare: () => void;
  onPublish: () => void;
  isPublished: boolean;
  isPublishing: boolean;
  savedAt?: string;
  isSaving?: boolean;
  onToggleLeftPane?: () => void;
  onToggleRightPane?: () => void;
};

export function BuilderHeader({
  title,
  onTitleChange,
  onTitleSave,
  onPreview,
  onShare,
  onPublish,
  isPublished,
  isPublishing,
  savedAt,
  isSaving = false,
  onToggleLeftPane,
  onToggleRightPane,
}: BuilderHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      {/* Left: Back & Title */}
      <div className="flex min-w-0 items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="size-8" aria-label="Back to dashboard">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>

        {onToggleLeftPane ? (
          <Button
            variant="outline"
            size="icon"
            className="size-8 md:hidden"
            onClick={onToggleLeftPane}
            aria-label="Open field types and AI"
          >
            <Plus className="size-4" />
          </Button>
        ) : null}

        <div className="flex items-center gap-2">
          <Input
            className="h-8 w-44 rounded-md border-transparent bg-transparent px-2 text-sm font-medium shadow-none transition-colors hover:border-border focus-visible:border-border sm:w-64"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={onTitleSave}
            aria-label="Form title"
          />

          {isSaving ? (
            <span className="hidden items-center gap-1.5 font-mono text-[11px] text-muted-foreground sm:inline-flex">
              <Loader2 className="size-3 animate-spin text-foreground" />
              Saving...
            </span>
          ) : (
            <span className="hidden items-center gap-1.5 font-mono text-[11px] text-muted-foreground sm:inline-flex">
              <Check className="size-3 text-foreground" />
              {savedAt ? `Saved ${savedAt}` : "Saved"}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />

        {onToggleRightPane ? (
          <Button
            variant="outline"
            size="icon"
            className="size-8 md:hidden"
            onClick={onToggleRightPane}
            aria-label="Open inspector and settings"
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className="h-8 gap-1.5 text-xs font-normal"
        >
          <Eye className="size-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onPublish}
          disabled={isPublishing}
          className="h-8 gap-1.5 text-xs font-normal"
        >
          {isPublishing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          <span>{isPublishing ? "Publishing..." : isPublished ? "Republish" : "Publish"}</span>
        </Button>

        <Button
          size="sm"
          onClick={onShare}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <Globe2 className="size-3.5" />
          <span>Share</span>
        </Button>
      </div>
    </header>
  );
}
