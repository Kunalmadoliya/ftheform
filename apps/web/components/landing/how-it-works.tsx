export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Workflow
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            From idea to responses in three steps
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A linear workflow designed to get clean, accessible forms published without ceremony.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="font-mono text-xs text-muted-foreground">01</span>
            <h3 className="mt-3 text-lg font-semibold text-foreground">
              Describe or add fields
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Start with a plain English prompt or a blank canvas. Pick from 9 typed field primitives.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="font-mono text-xs text-muted-foreground">02</span>
            <h3 className="mt-3 text-lg font-semibold text-foreground">
              Edit in the workspace
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Rearrange questions, fine-tune validation, customize descriptions, and inspect live previews.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="font-mono text-xs text-muted-foreground">03</span>
            <h3 className="mt-3 text-lg font-semibold text-foreground">
              Publish and collect
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Turn the form live, share your permanent URL, and watch submissions arrive in your dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
