"use client";

import { useEffect, type ReactNode } from "react";
import { LogOut } from "lucide-react";
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
    <div className="flex min-h-screen bg-muted/30">
      <SidebarNav />
      <main className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6 lg:px-10">
          <p className="text-sm font-medium">{title}</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOut />
              Sign out
            </Button>
          </div>
        </header>
        <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
