"use client";

import Link from "next/link";
import {
  IconCheck,
  IconForms,
  IconLogIn,
  IconLogOut,
  IconPassword,
  IconWarning,
} from "~/components/icons/app-icons";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export function FormNotFoundScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-[var(--radius)] border border-border bg-muted/50 text-foreground">
          <IconForms className="size-6" />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground">Form not found</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          This form does not exist, has been deleted, or the link may be incorrect.
        </p>
      </div>
    </main>
  );
}

export function LoadingScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="size-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        <p className="font-mono text-xs text-muted-foreground">Loading form...</p>
      </div>
    </main>
  );
}

export function SignInRequiredScreen({ formUrl }: { formUrl: string }) {
  const returnTo = `/form/${encodeURIComponent(formUrl)}`;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-[var(--radius)] border border-border bg-muted/50 text-foreground">
          <IconPassword className="size-6" />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground">Sign in to respond</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          This form requires an authenticated account to participate.
        </p>
        <div className="mt-6">
          <Button asChild className="w-full text-xs font-medium">
            <Link href={`/login?next=${encodeURIComponent(returnTo)}`}>
              <IconLogIn className="size-3.5 mr-2" />
              Continue to sign in
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

export function AnonymousOnlyScreen({ onSignOut }: { onSignOut: () => Promise<void> }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-[var(--radius)] border border-border bg-muted/50 text-foreground">
          <IconWarning className="size-6" />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground">Anonymous responses only</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Sign out of your account to respond to this form.
        </p>
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full text-xs font-medium"
            onClick={() => void onSignOut()}
          >
            <IconLogOut className="size-3.5 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </main>
  );
}

export function FormClosedScreen({ isLimit = false }: { isLimit?: boolean }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-[var(--radius)] border border-border bg-muted/50 text-foreground">
          <IconWarning className="size-6" />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
          {isLimit ? "This form has reached its response limit" : "This form is closed"}
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {isLimit
            ? "The creator has set a limit on submissions and is no longer accepting responses."
            : "The creator is not accepting submissions at this time."}
        </p>
      </div>
    </main>
  );
}

export function SnapshotUnavailableScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-[var(--radius)] border border-border bg-muted/50 text-foreground">
          <IconWarning className="size-6" />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground">This form is unavailable</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          A published version of this form could not be loaded. Please try again later.
        </p>
      </div>
    </main>
  );
}

export function SubmissionCompleteScreen({ alreadySubmitted = false }: { alreadySubmitted?: boolean }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-8 text-center shadow-xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-[var(--radius)] border border-border bg-muted/50 text-foreground">
          <IconCheck className="size-6" />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
          {alreadySubmitted ? "You already submitted a response" : "Response submitted"}
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {alreadySubmitted
            ? "This form does not allow another response from your recognized identity."
            : "Thank you for your response."}
        </p>
      </div>
    </main>
  );
}

export function OwnerPreviewBanner() {
  return (
    <div className="border-b border-border bg-muted/60 px-4 py-2.5 text-center">
      <p className="font-mono text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Preview mode</span> — responses cannot be submitted.
      </p>
    </div>
  );
}

export function RestartVersionDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Form Updated</DialogTitle>
          <DialogDescription>
            This form changed. Discard your saved draft and start a new response?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Start a new response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
