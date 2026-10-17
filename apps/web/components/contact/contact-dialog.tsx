"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { IconMail } from "~/components/icons/app-icons";
import { ContactForm } from "./contact-form";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-[var(--radius)] border border-border bg-muted">
              <IconMail className="size-3.5 text-foreground" />
            </span>
            <DialogTitle>Contact Us</DialogTitle>
          </div>
          <DialogDescription>
            Have a question, feedback, or need support? Send us a message and we'll get back to you.
          </DialogDescription>
        </DialogHeader>

        <ContactForm className="pt-2" />
      </DialogContent>
    </Dialog>
  );
}
