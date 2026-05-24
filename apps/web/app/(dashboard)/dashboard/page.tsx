"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PixelButton } from "../../../components/PixelButton";

export default function DashboardHome() {
  //   const [forms, setForms] = useState<FormDoc[]>([]);
  const [now] = useState(Date.now());
  //   useEffect(() => setForms(formsStore.list()), []);

  //   const totalResponses = forms.reduce((a, f) => a + f.responses, 0);
  //   const published = forms.filter((f) => f.published).length;
  //   const drafts = forms.length - published;
  //   const xp = computeXp({ responses: totalResponses, published, drafts });
  //   const lvl = progressForLevel(xp);

  const responsesThisWeek = useMemo(() => {
    const cutoff = now - 7 * 86400000;
    // return formsStore.listResponses().filter((r) => r.submittedAt >= cutoff).length;
  }, [now]);

  const stats = [
    { label: "Total XP", value: "3000", sub: `Lvl kunal`, pct: "kunal", color: "bg-accent" },
    {
      label: "Published",
      value: String(5),
      sub: `drafts`,
      pct: 55 ? (5 / 5) * 100 : 0,
      color: "bg-primary",
    },
    {
      label: "Responses",
      value: "200",
      sub: "all time",
      pct: Math.min(100),
      color: "bg-quest-sky",
    },
    {
      label: "This Week",
      value: `+45`,
      sub: "new submissions",
      pct: Math.min(100, 4 * 10),
      color: "bg-quest-magenta",
    },
  ];

  const createAndOpen = () => {
    // const f = formsStore.create();
    // window.location.href = `/builder/${f.id}`;
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <div className="font-pixel text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Welcome back, hero
          </div>
          <h1 className="font-pixel text-5xl uppercase">Mission Select</h1>
        </div>
        <PixelButton size="lg" onClick={createAndOpen}>
          + New Form
        </PixelButton>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-5 rounded-md border-2 border-quest-ink/15 bg-card shadow-pixel"
          >
            <div className="text-[10px] font-pixel uppercase tracking-widest text-muted-foreground mb-2">
              {s.label}
            </div>
            <div className="font-pixel text-4xl mb-1">{s.value}</div>
            <div className="text-[10px] font-pixel uppercase tracking-widest text-muted-foreground mb-2">
              {s.sub}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${s.color}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-pixel text-2xl uppercase">Your Forms</h2>
          <Link
            href="/dashboard/forms"
            className="text-xs font-pixel uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            View all →
          </Link>
        </div>

        {/* {forms.length === 0 ? (
          <EmptyState onCreate={createAndOpen} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.slice(0, 6).map((f) => (
              <FormCard key={f.id} form={f} onChange={() => setForms(formsStore.list())} />
            ))}
          </div>
        )} */}
      </section>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="p-12 rounded-md border-2 border-dashed border-quest-ink/20 text-center bg-card">
      <div className="font-pixel text-5xl mb-4">⚔</div>
      <div className="font-pixel text-2xl uppercase mb-2">No forms yet</div>
      <p className="text-muted-foreground mb-6">Build your first form to start earning XP.</p>
      <PixelButton onClick={onCreate}>Build First Form</PixelButton>
    </div>
  );
}

function FormCard({ form, onChange }: { form: FormDoc; onChange: () => void }) {
  const togglePublish = () => {
    formsStore.update(form.id, { published: !form.published });
    onChange();
  };
  const remove = () => {
    if (confirm(`Delete "${form.title}"? This abandons the form forever.`)) {
      formsStore.remove(form.id);
      onChange();
    }
  };
  const share = () => {
    const url = `${window.location.origin}/f/${form.id}`;
    navigator.clipboard?.writeText(url);
    alert(
      `Share link copied!\n\n${url}${!form.published ? "\n\nNote: form is currently a draft — publish it to make the link work." : ""}`,
    );
  };
  return (
    <div className="p-5 rounded-md border-2 border-quest-ink/15 bg-card shadow-pixel hover:border-primary transition-colors flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-[10px] font-pixel uppercase tracking-widest px-2 py-1 rounded ${
            form.published ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
          }`}
        >
          {form.published ? "● Live" : "○ Draft"}
        </span>
        <span className="text-[10px] font-pixel uppercase tracking-widest text-muted-foreground">
          {form.fields.length} fields
        </span>
      </div>
      <Link
        href={`/builder/${form.id}`}
        className="font-pixel text-xl mb-1 hover:text-primary transition-colors"
      >
        {form.title}
      </Link>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
        {form.description || "No description"}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span className="font-pixel">{form.responses} responses</span>
        <span>Updated {new Date(form.updatedAt).toLocaleDateString()}</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-auto">
        <Link href={`/builder/${form.id}`} className="flex-1">
          <PixelButton size="sm" className="w-full">
            Edit
          </PixelButton>
        </Link>
        <PixelButton size="sm" variant="leaf" onClick={share}>
          ↗ Share
        </PixelButton>
        <PixelButton size="sm" variant="ghost" onClick={togglePublish}>
          {form.published ? "Unpublish" : "Publish"}
        </PixelButton>
        <PixelButton size="sm" variant="ghost" onClick={remove} aria-label="Delete">
          ✕
        </PixelButton>
      </div>
    </div>
  );
}
