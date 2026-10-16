"use client";

import { useEffect, type ReactNode } from "react";
import { IconLogOut } from "~/components/icons/app-icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { SidebarNav } from "~/components/dashboard/sidebar-nav";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/theme-toggle";
import { authClient } from "~/lib/auth-client";

export function WorkspaceLayout({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) router.replace("/login");
  }, [isPending, router, session]);

  async function signOut() {
    try {
      await authClient.signOut();
      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign out.");
    }
  }

  if (isPending || !session?.user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6 lg:px-10">
          <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
              onClick={() => void signOut()}
            >
              <IconLogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </header>
        <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
