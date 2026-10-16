"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, LayoutTemplate, MessageSquare } from "lucide-react";

import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";
import { useSubmissionsAcrossForms } from "~/hooks/form/use-submissions-across-forms";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Forms", href: "/forms", icon: FileText },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Responses", href: "/responses", icon: MessageSquare },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [lastVisited, setLastVisited] = useState<number | null | undefined>(undefined);
  const { data: forms = [] } = trpc.form.listFormsByUser.useQuery();
  const { entries } = useSubmissionsAcrossForms(forms.map(({ id, title }) => ({ id, title })));
  const hasNewResponses = entries.some(({ submissions }) =>
    submissions.some((submission) => {
      const submittedAt = submission.submittedAt
        ? new Date(submission.submittedAt).getTime()
        : Number.NaN;
      return (
        lastVisited !== undefined &&
        Number.isFinite(submittedAt) &&
        (lastVisited === null || submittedAt > lastVisited)
      );
    }),
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("responses-last-visited");
    const storedTimestamp = stored ? Number(stored) : null;
    setLastVisited(
      storedTimestamp !== null && !Number.isFinite(storedTimestamp) ? null : storedTimestamp,
    );
    if (pathname === "/responses") {
      const now = Date.now();
      window.localStorage.setItem("responses-last-visited", String(now));
      setLastVisited(now);
    }
  }, [pathname]);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5 text-sm font-semibold tracking-tight text-sidebar-foreground">
        <span className="flex size-6 items-center justify-center rounded-[var(--radius)] bg-foreground font-mono text-[11px] font-bold text-background">
          F
        </span>
        <span className="font-mono text-xs font-semibold tracking-wider text-foreground">
          FTHEFORM
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Button
              key={item.label}
              asChild
              variant={active ? "secondary" : "ghost"}
              className={`w-full justify-start gap-2.5 h-9 px-3 text-xs font-normal transition-colors ${
                active
                  ? "bg-secondary text-foreground font-medium shadow-none"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Link href={item.href} aria-current={active ? "page" : undefined}>
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
                {item.label === "Responses" && hasNewResponses ? (
                  <span
                    className="ml-auto size-1.5 rounded-full bg-foreground"
                    aria-label="New responses indicator"
                  />
                ) : null}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          © FTHEFORM
        </p>
      </div>
    </aside>
  );
}