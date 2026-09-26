"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Globe2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

 type ShareFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formUrl?: string | null;
  isPublished: boolean;
  isPublishing: boolean;
  onPublish: () => Promise<string | null>;
};

export function ShareFormDialog({ open, onOpenChange, formUrl, isPublished, isPublishing, onPublish }: ShareFormDialogProps) {
  const [shareUrl, setShareUrl] = useState(formUrl ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setShareUrl(formUrl ?? "");
      setCopied(false);
    }
  }, [formUrl, open]);

  async function handlePublish() {
    const publishedUrl = await onPublish();
    if (publishedUrl) setShareUrl(publishedUrl);
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const displayedUrl = shareUrl || formUrl || "";

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Share your form</DialogTitle><DialogDescription>{isPublished ? "Your form is live. Copy the link below to share it." : "Publish your form to create a public link."}</DialogDescription></DialogHeader><div className="space-y-3">{displayedUrl ? <div className="flex gap-2"><Input value={displayedUrl} readOnly aria-label="Public form link" /><Button type="button" variant="outline" size="icon" onClick={() => void copyShareUrl()} aria-label="Copy public form link">{copied ? <Check /> : <Copy />}</Button></div> : <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No public link has been created yet.</p>}</div><DialogFooter><Button type="button" onClick={() => void handlePublish()} disabled={isPublishing}>{isPublishing ? "Publishing..." : <><Globe2 />{isPublished ? "Republish" : "Publish form"}</>}</Button></DialogFooter></DialogContent></Dialog>;
}
