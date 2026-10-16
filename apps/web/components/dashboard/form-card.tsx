"use client";

import Link from "next/link";
import { BarChart3, Copy, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export type FormSummary = {
  id: string;
  title: string;
  description?: string | null;
  formUrl?: string | null;
  isPublished: boolean;
  isArchived: boolean;
  lifecycle: "live" | "draft" | "archived";
  submittedCount: number;
  views?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
};

type FormCardProps = {
  form: FormSummary;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
};

export function FormCard({
  form,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onPublish,
  onUnpublish,
}: FormCardProps) {
  async function copyShareLink() {
    if (!form.formUrl || form.lifecycle !== "live") return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/form/${form.formUrl}`
      );
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Failed to copy share link");
    }
  }

  const updatedAt = new Date(form.updatedAt ?? form.createdAt);
  const isLive = form.lifecycle === "live";
  const publicHref = form.formUrl ? `/form/${form.formUrl}` : undefined;

  return (
    <Card className="group relative flex h-full flex-col border-border bg-card p-0 py-0 gap-0 transition-colors hover:border-foreground/30">
      {/* Content Area: strictly p-5 on all 4 sides */}
      <div className="flex flex-1 flex-col p-5">
        {/* Badge & Actions Row */}
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant={
              form.lifecycle === "archived"
                ? "outline"
                : isLive
                  ? "default"
                  : "secondary"
            }
            className="font-mono text-[10px] uppercase tracking-wider"
          >
            {isLive ? "Live" : form.lifecycle === "draft" ? "Draft" : "Archived"}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label={`More actions for ${form.title}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              {form.lifecycle !== "archived" ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/forms/${form.id}/responses`} className="cursor-pointer">
                      <BarChart3 className="size-3.5 mr-2" />
                      View responses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <Pencil className="size-3.5 mr-2" />
                    Edit details
                  </DropdownMenuItem>
                  {isLive ? (
                    <>
                      <DropdownMenuItem
                        onClick={copyShareLink}
                        disabled={!form.formUrl}
                        className="cursor-pointer"
                      >
                        <Copy className="size-3.5 mr-2" />
                        Copy share link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onUnpublish} className="cursor-pointer">
                        Unpublish form
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={onPublish} className="cursor-pointer">
                      Publish form
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onArchive} className="cursor-pointer">
                    Archive form
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={onRestore} className="cursor-pointer">
                  Restore form
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="size-3.5 mr-2" />
                Delete permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h3
          className="mt-3 line-clamp-1 font-semibold text-base tracking-tight text-foreground"
          title={form.title}
        >
          {form.title}
        </h3>

        {/* Description: clamped to 2 lines with fixed min height and leading-[18px] */}
        <p className="mt-1 line-clamp-2 h-9 text-xs leading-[18px] text-muted-foreground">
          {form.description || "No description provided."}
        </p>
      </div>

      {/* Meta Row: full-bleed divider, real submittedCount response(s) */}
      <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 font-mono text-[11px] text-muted-foreground">
        <span>
          {form.submittedCount} {form.submittedCount === 1 ? "response" : "responses"}
        </span>
        <span>Updated {updatedAt.toLocaleDateString()}</span>
      </div>

      {/* Footer: full-bleed divider, strictly px-5 py-4 */}
      <div className="flex items-center gap-2 border-t border-border/60 px-5 py-4 mt-auto">
        {form.lifecycle === "archived" ? (
          <Button
            className="w-full h-8 text-xs font-medium"
            variant="outline"
            onClick={onRestore}
          >
            Restore form
          </Button>
        ) : (
          <>
            <Button asChild className="flex-1 h-8 text-xs font-medium">
              <Link href={`/forms/${form.id}/builder`}>
                <Pencil className="size-3.5 mr-1.5" />
                Edit
              </Link>
            </Button>
            {isLive && publicHref ? (
              <Button
                asChild
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
              >
                <a
                  href={publicHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open public form"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
                disabled
                aria-label="Public form unavailable"
              >
                <ExternalLink className="size-3.5" />
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}