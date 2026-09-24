"use client";

import Link from "next/link";
import { BarChart3, FileText, LayoutTemplate, MessageSquare, Settings, Sparkles } from "lucide-react";

import { Button } from "~/components/ui/button";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Forms", href: "/dashboard", icon: FileText },
  { label: "Templates", href: "/dashboard", icon: LayoutTemplate },
  { label: "Responses", href: "/dashboard", icon: MessageSquare },
  { label: "Analytics", href: "/dashboard", icon: BarChart3 },
  { label: "Settings", href: "/dashboard", icon: Settings },
];

export function SidebarNav() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6 text-sm font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        FTHEFORM
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.label}
              asChild
              variant={index === 0 ? "secondary" : "ghost"}
              className="w-full justify-start gap-3"
            >
              <Link href={item.href}>
                <Icon className="size-4" />
                {item.label}
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