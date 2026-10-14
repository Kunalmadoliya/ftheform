"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, LayoutTemplate, MessageSquare, Sparkles } from "lucide-react";

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
    setLastVisited(storedTimestamp !== null && !Number.isFinite(storedTimestamp) ? null : storedTimestamp);
    if (pathname === "/responses") {
      const now = Date.now();
      window.localStorage.setItem("responses-last-visited", String(now));
      setLastVisited(now);
    }
  }, [pathname]);

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6 text-sm font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        FTHEFORM
      </div>
      <nav className="flex-1 space-y-1 p-4">
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
              className="w-full justify-start gap-3"
            >
              <Link href={item.href} aria-current={active ? "page" : undefined}>
                <Icon className="size-4" />
                {item.label}
                {item.label === "Responses" && hasNewResponses ? (
                  <span
                    className="ml-auto size-2 rounded-full bg-primary"
                    aria-label="New responses"
                  />
                ) : null}
              </Link>
            </Button>
          );
        })}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">
        Build clear forms. Collect useful answers.
      </div>
    </aside>
  );
}