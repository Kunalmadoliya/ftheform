"use client";

import { useState, type FormEvent } from "react";
import { IconCheck, IconMail, IconSpinner } from "~/components/icons/app-icons";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { trpc } from "~/trpc/client";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";

interface ContactFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function ContactForm({ onSuccess, className = "" }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const sendMessageMutation = trpc.contact.sendMessage.useMutation();

  const isPending = sendMessageMutation.isPending;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (name.trim().length < 2 || name.trim().length > 100) {
      setErrorMessage("Name must be between 2 and 100 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (message.trim().length < 10 || message.trim().length > 2000) {
      setErrorMessage("Message must be between 10 and 2000 characters.");
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        honeypot: honeypot || undefined,
      });

      setIsSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
      setHoneypot("");
      onSuccess?.();
    } catch (err: unknown) {
      // Always show generic error message as requested
      const msg = getTrpcErrorMessage(err, "Could not send your message, please try again");
      setErrorMessage(msg || "Could not send your message, please try again");
    }
  }

  if (isSubmitted) {
    return (
      <div className={`rounded-xl border border-border bg-card p-6 text-center space-y-4 ${className}`}>
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <IconCheck className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Message Sent</h3>
          <p className="text-xs text-muted-foreground">
            Thank you for reaching out! We have received your message and will get back to you shortly.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSubmitted(false)}
          className="text-xs"
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Hidden honeypot field to block automated spam bots */}
      <input
        type="text"
        name="website_hp"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="sr-only opacity-0 absolute -z-10 pointer-events-none"
        aria-hidden="true"
      />

      <div className="space-y-1.5">
        <Label htmlFor="contact-name" className="text-xs font-medium">
          Name
        </Label>
        <Input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          minLength={2}
          maxLength={100}
          disabled={isPending}
          className="text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-email" className="text-xs font-medium">
          Email address
        </Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={isPending}
          className="text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="contact-message" className="text-xs font-medium">
            Message
          </Label>
          <span className="text-[10px] text-muted-foreground">
            {message.length} / 2000
          </span>
        </div>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          required
          minLength={10}
          maxLength={2000}
          disabled={isPending}
          className="min-h-28 resize-none text-xs leading-relaxed"
        />
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full text-xs font-medium h-9 gap-1.5"
      >
        {isPending ? (
          <>
            <IconSpinner className="size-3.5 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <IconMail className="size-3.5" />
            <span>Send Message</span>
          </>
        )}
      </Button>
    </form>
  );
}
