"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconCopy, IconPublish, IconSpinner } from "~/components/icons/app-icons";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

type ShareFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formUrl?: string | null;
  isPublished: boolean;
  isPublishing: boolean;
};

export function ShareFormDialog({
  open,
  onOpenChange,
  formUrl,
  isPublished,
  isPublishing,
}: ShareFormDialogProps) {
  const [shareUrl, setShareUrl] = useState(formUrl ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setShareUrl(formUrl ?? "");
      setCopied(false);
    }
  }, [formUrl, open]);

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    window.setTimeout(() => setCopied(false), 2000);
  }

  const displayedUrl = shareUrl || formUrl || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-[var(--radius)] border border-border bg-muted">
              <IconPublish className="size-3.5 text-foreground" />
            </span>
            <DialogTitle>Share your form</DialogTitle>
          </div>
          <DialogDescription>
            {isPublished
              ? "Your form is published and ready to receive submissions."
              : "Generating public share link..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isPublishing ? (
            <div className="flex items-center gap-2.5 rounded-[var(--radius)] border border-border/80 bg-muted/40 p-4 text-xs text-muted-foreground">
              <IconSpinner className="size-4 animate-spin text-foreground shrink-0" />
              <span>Publishing form to live URL...</span>
            </div>
          ) : displayedUrl ? (
            <div className="flex gap-2">
              <Input
                value={displayedUrl}
                readOnly
                aria-label="Public form URL"
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void copyShareUrl()}
                aria-label="Copy public form link"
                className="shrink-0 size-9"
              >
                {copied ? <IconCheck className="size-4 text-foreground" /> : <IconCopy className="size-4" />}
              </Button>
            </div>
          ) : (
            <div className="rounded-[var(--radius)] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No public link is available yet.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
