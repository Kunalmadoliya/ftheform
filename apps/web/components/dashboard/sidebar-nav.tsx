"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "~/components/brand/logo";
import {
  IconAdmin,
  IconAnalytics,
  IconDashboard,
  IconForms,
  IconMail,
  IconTemplates,
  IconResponses,
} from "~/components/icons/app-icons";

import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";
import { useSubmissionsAcrossForms } from "~/hooks/form/use-submissions-across-forms";
import { useUserRole } from "~/hooks/auth/use-user-role";

const baseItems = [
  { label: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { label: "Forms", href: "/forms", icon: IconForms },
  { label: "Templates", href: "/templates", icon: IconTemplates },
  { label: "Responses", href: "/responses", icon: IconResponses },
  { label: "Analytics", href: "/analytics", icon: IconAnalytics },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [lastVisited, setLastVisited] = useState<number | null | undefined>(undefined);
  const { data: forms = [] } = trpc.form.listFormsByUser.useQuery();
  const { entries } = useSubmissionsAcrossForms(forms.map(({ id, title }) => ({ id, title })));
  const { data: roleData } = useUserRole();
  const isAdmin = roleData?.userRole === "admin";

  const items = isAdmin
    ? [...baseItems, { label: "Admin", href: "/admin", icon: IconAdmin }]
    : baseItems;

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
      <div className="flex h-14 items-center border-b border-border px-5 text-sm font-semibold tracking-tight text-sidebar-foreground">
        <Logo size="sm" showWordmark />
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

      <div className="border-t border-border p-3 space-y-2">
        <Button
          asChild
          variant="ghost"
          className="w-full justify-start gap-2.5 h-8 px-2 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <Link href="/contact">
            <IconMail className="size-3.5 shrink-0" />
            <span>Contact Support</span>
          </Link>
        </Button>
        <p className="px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          © FTHEFORM
        </p>
      </div>
    </aside>
  );
}