"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type DeleteFieldDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldLabel?: string;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
};

export function DeleteFieldDialog({
  open,
  onOpenChange,
  fieldLabel = "this field",
  onConfirm,
  isDeleting = false,
}: DeleteFieldDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete field?</DialogTitle>
          <DialogDescription>
            Delete &ldquo;{fieldLabel}&rdquo;? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
          >
            {isDeleting ? "Deleting..." : "Delete field"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
