import {
  IconAi,
  IconCheck,
  IconCopy,
  IconOpenExternal,
  IconResponses,
  fieldTypeIcons,
} from "~/components/icons/app-icons";

const FIELD_TYPES = [
  { type: "text", label: "Text" },
  { type: "textarea", label: "Long Text" },
  { type: "email", label: "Email" },
  { type: "number", label: "Number" },
  { type: "select", label: "Dropdown" },
  { type: "multiselect", label: "Multi-select" },
  { type: "checkbox", label: "Checkbox" },
  { type: "rating", label: "Rating" },
  { type: "date", label: "Date" },
] as const;

export function BentoFeatures() {
  return (
    <section id="features" className="border-b border-border bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Capabilities
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Engineered for precision and speed
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Every feature is focused on zero-friction form creation, seamless respondent
            completion, and clean response analysis.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Tile 1: AI Form Builder (col-span-2) */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 md:col-span-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg border border-border bg-muted/40">
                  <IconAi className="size-4" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">01 / Generation</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                Describe a form, AI builds it
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Natural language prompts are converted into typed form fields, validation
                rules, and structured answer schemas automatically.
              </p>
            </div>
            <div className="mt-6 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-foreground" />
                Prompt: &ldquo;Job application with portfolio link and availability&rdquo;
              </div>
              <div className="mt-3 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-1.5">
                  <span className="text-foreground">Full Name</span>
                  <span className="text-muted-foreground">text • required</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-1.5">
                  <span className="text-foreground">Portfolio URL</span>
                  <span className="text-muted-foreground">text • optional</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-1.5">
                  <span className="text-foreground">Earliest Start Date</span>
                  <span className="text-muted-foreground">date • required</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tile 2: 9 Field Types (col-span-1) */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 md:col-span-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">02 / Field Types</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                9 typed inputs
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Built-in input primitives with strict schema validation and accessible keyboard controls.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {FIELD_TYPES.map(({ type, label }) => {
                const IconComponent = fieldTypeIcons[type];
                return (
                  <div
                    key={type}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-foreground"
                  >
                    <IconComponent className="size-3.5 text-muted-foreground" />
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tile 3: One Public Link (col-span-1) */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 md:col-span-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">03 / Distribution</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                One public link per form
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Instant publishing with a permanent canonical link. Accessible to any browser or device.
              </p>
            </div>
            <div className="mt-6 rounded-xl border border-border bg-background p-3.5">
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 font-mono text-xs">
                <span className="truncate text-foreground">/form/team-feedback-2026</span>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <IconCopy className="size-3.5" />
                  <IconOpenExternal className="size-3.5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                <span>Status: LIVE</span>
                <span>HTTPS Encrypted</span>
              </div>
            </div>
          </div>

          {/* Tile 4: Autosave & Resume (col-span-1) */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 md:col-span-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">04 / Continuity</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                Autosave & resume
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Respondents never lose partial answers. Draft answers persist locally and reload on return.
              </p>
            </div>
            <div className="mt-6 rounded-xl border border-border bg-background p-4 font-mono text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Step 3 of 5</span>
                <span className="flex items-center gap-1 text-foreground">
                  <IconCheck className="size-3" /> Saved locally
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-3/5 bg-foreground" />
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Responses resume exactly where the respondent left off.
              </p>
            </div>
          </div>

          {/* Tile 5: Responses & CSV Export (col-span-1) */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 md:col-span-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg border border-border bg-muted/40">
                  <IconResponses className="size-4" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">05 / Export</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                Responses & CSV export
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Inspect submissions inline, expand structured answers, or export raw data as CSV.
              </p>
            </div>
            <div className="mt-6 rounded-xl border border-border bg-background p-3.5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2 text-muted-foreground">
                <span>Submission #104</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground">CSV Ready</span>
              </div>
              <div className="mt-2 space-y-1 text-[11px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Rating:</span>
                  <span className="text-foreground">5 / 5</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Status:</span>
                  <span className="text-foreground">Completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tile 6: Access Control (col-span-3 on large) */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 md:col-span-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">06 / Governance</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                Configurable access control
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Control who can answer and how many times. Switch between anonymous open forms and authenticated workflows.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-3.5 font-mono text-xs">
                <p className="font-medium text-foreground">Authentication</p>
                <p className="mt-1 text-muted-foreground">Anonymous or sign-in only</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3.5 font-mono text-xs">
                <p className="font-medium text-foreground">Submission Limits</p>
                <p className="mt-1 text-muted-foreground">One or multiple submissions</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3.5 font-mono text-xs">
                <p className="font-medium text-foreground">Response Caps</p>
                <p className="mt-1 text-muted-foreground">Auto-close when quota is met</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
