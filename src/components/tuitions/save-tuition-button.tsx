"use client";

import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";

import { useSavedTuitions } from "@/components/tuitions/saved-tuitions-provider";
import { cn } from "@/lib/utils";

type SaveTuitionButtonProps = {
  tuitionId: string;
  tuitionTitle: string;
  className?: string;
  showLabel?: boolean;
};

export function SaveTuitionButton({
  tuitionId,
  tuitionTitle,
  className,
  showLabel = false,
}: SaveTuitionButtonProps) {
  const { enabled, isSaved, isSaving, toggleSaved } = useSavedTuitions();

  if (!enabled) return null;

  const saved = isSaved(tuitionId);
  const saving = isSaving(tuitionId);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved tuitions" : "Save tuition"}
      aria-pressed={saved}
      title={saved ? "Remove from saved tuitions" : "Save tuition"}
      disabled={saving}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleSaved(tuitionId, tuitionTitle);
      }}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur transition hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70",
        saved && "text-primary hover:text-primary",
        className
      )}
    >
      {saving ? (
        <Loader2 className="size-4 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="size-4" />
      ) : (
        <Bookmark className="size-4" />
      )}
      {showLabel ? <span>{saved ? "Saved" : "Save tuition"}</span> : null}
    </button>
  );
}
