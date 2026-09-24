"use client";

import Link from "next/link";
import { Copy, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";

export type FormSummary = {
  id: string;
  title: string;
  description?: string | null;
  formUrl?: string | null;
  isPublished: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
};

type FormCardProps = {
  form: FormSummary;
  fieldCount?: number;
  onEdit: () => void;
  onDelete: () => void;
};

export function FormCard({ form, fieldCount = 0, onEdit, onDelete }: FormCardProps) {
  async function copyShareLink() {
    if (form.formUrl) await navigator.clipboard.writeText(form.formUrl);
  }

  const updatedAt = new Date(form.updatedAt ?? form.createdAt);

  return (
    <Card className="flex min-h-64 flex-col">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <Badge variant={form.isPublished ? "default" : "secondary"}>
            {form.isPublished ? "Published" : "Draft"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`More actions for ${form.title}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Pencil />Edit details</DropdownMenuItem>
              <DropdownMenuItem onClick={copyShareLink} disabled={!form.formUrl}><Copy />Copy share link</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 />Delete form</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold">{form.title}</h3>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">
            {form.description || "No description yet."}
          </p>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <span>{fieldCount} {fieldCount === 1 ? "field" : "fields"}</span>
        <span>Updated {updatedAt.toLocaleDateString()}</span>
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild className="flex-1"><Link href={`/builder/${form.id}`}><Pencil />Edit</Link></Button>
        <Button variant="outline" size="icon" onClick={copyShareLink} disabled={!form.formUrl} aria-label="Copy share link"><ExternalLink /></Button>
      </CardFooter>
    </Card>
  );
}