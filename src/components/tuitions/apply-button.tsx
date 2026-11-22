"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyToTuition } from "@/lib/mutation";

type ApplyButtonProps = {
  tuitionId: string;
  tuitionTitle: string;
};

export function ApplyButton({ tuitionId, tuitionTitle }: ApplyButtonProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);
  const dialogTitleId = useId();
  const noteId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSubmitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = note.trim();
    if (message.length < 10) {
      toast.error("Please write at least 10 characters for the tutor.");
      return;
    }

    setIsSubmitting(true);

    try {
      await applyToTuition({ tuitionId, note: message });
      setApplied(true);
      setOpen(false);
      setNote("");
      toast.success("Application submitted successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit application.";

      if (errorMessage.toLowerCase().includes("already applied")) {
        setApplied(true);
        setOpen(false);
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="lg"
        variant={applied ? "secondary" : "default"}
        disabled={applied}
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto"
        title={applied ? "You have already applied to this tuition" : undefined}
      >
        {applied ? <Check /> : <Send />}
        {applied ? "Applied" : "Apply Now"}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
        >
          <button
            type="button"
            aria-label="Close apply dialog"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isSubmitting && setOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-xl bg-card p-6 text-card-foreground shadow-xl ring-1 ring-foreground/10">
            <h2 id={dialogTitleId} className="text-lg font-semibold">
              Apply for this tuition
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {tuitionTitle}
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={noteId}>Message to the tutor</Label>
                <Textarea
                  id={noteId}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Introduce yourself, your current level, and your preferred schedule..."
                  rows={4}
                  required
                  minLength={10}
                  maxLength={1000}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This message is shared with the tutor along with your profile
                  details.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Send />
                  )}
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
