import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <Card className="rounded-[var(--radius)] border border-border/80 bg-card p-4 shadow-none">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="font-mono text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}