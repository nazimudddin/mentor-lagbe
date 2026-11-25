"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import {
  AlertCircle,
  Bookmark,
  BookOpen,
  CalendarDays,
  Clock,
  Eye,
  GraduationCap,
  Loader2,
  MapPin,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useSavedTuitions } from "@/components/tuitions/saved-tuitions-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSavedTuitions,
  getStudentPlan,
  type SavedTuition,
  type StudentPlan,
} from "@/lib/action";
import { removeSavedTuition } from "@/lib/mutation";
import { cn } from "@/lib/utils";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFee(value?: number) {
  return `৳${Number(value || 0).toLocaleString()}`;
}

export default function SavedTuitionsPage() {
  const { refresh: refreshSavedIds } = useSavedTuitions();
  const [savedTuitions, setSavedTuitions] = useState<SavedTuition[]>([]);
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<SavedTuition | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SavedTuition | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const detailsTitleId = useId();

  const loadSavedTuitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSavedTuitions();
      setSavedTuitions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load saved tuitions."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [data, planData] = await Promise.all([
          getSavedTuitions(),
          getStudentPlan().catch(() => null),
        ]);
        if (!cancelled) {
          setSavedTuitions(data);
          if (planData) setPlan(planData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load saved tuitions."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!detailTarget) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailTarget(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailTarget]);

  const handleRemove = async () => {
    if (!removeTarget) return;

    setRemovingId(removeTarget.id);

    try {
      await removeSavedTuition(removeTarget.id);
      setSavedTuitions((current) =>
        current.filter((tuition) => tuition.id !== removeTarget.id)
      );
      toast.success("Tuition removed from saved tuitions.");
      setRemoveTarget(null);
      setDetailTarget((current) =>
        current?.id === removeTarget.id ? null : current
      );
      void refreshSavedIds();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to remove saved tuition."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const savedLimit = plan?.savedLimit ?? null;
  const atSavedLimit = Boolean(
    plan &&
      !plan.isPro &&
      savedLimit !== null &&
      savedTuitions.length >= savedLimit
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Saved Tuitions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the tuitions you bookmarked and apply when you are ready.
          </p>
          {plan ? (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {plan.isPro
                ? "Student Pro · Unlimited bookmarks"
                : `${savedTuitions.length} of ${savedLimit} bookmarks used`}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void loadSavedTuitions()}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            className="gap-1.5"
            render={<Link href="/dashboard/student/browse-tuitions" />}
          >
            <BookOpen className="size-4" />
            Browse Tuitions
          </Button>
        </div>
      </div>

      {atSavedLimit ? (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p>
            You have reached the Free plan limit of {savedLimit} saved tuitions.
            Upgrade to Student Pro for unlimited bookmarks.
          </p>
          <Link
            href="/dashboard/student/upgrade-pro"
            className="inline-flex w-fit items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Upgrade to Pro
          </Link>
        </div>
      ) : null}

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="overflow-hidden pt-0">
                <Skeleton className="h-40 w-full rounded-none" />
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="mt-4 h-8 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-6" />
              </span>
              <h2 className="mt-3 text-base font-semibold">
                Could not load your saved tuitions
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {error}
              </p>
              <Button
                variant="outline"
                onClick={() => void loadSavedTuitions()}
                className="mt-4 gap-1.5"
              >
                <RefreshCw className="size-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : savedTuitions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bookmark className="size-6" />
              </span>
              <h2 className="mt-3 text-base font-semibold">
                No saved tuitions yet
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Tap the bookmark icon on any tuition card to save it here for
                later.
              </p>
              <Button
                className="mt-4 gap-1.5"
                render={<Link href="/dashboard/student/browse-tuitions" />}
              >
                <BookOpen className="size-4" />
                Browse Tuitions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {savedTuitions.map((tuition) => (
              <Card
                key={tuition.id}
                className="flex h-full flex-col gap-0 overflow-hidden pt-0"
              >
                <div className="relative h-40 w-full overflow-hidden bg-muted">
                  {tuition.bannerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tuition.bannerImage}
                      alt={tuition.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-secondary/40">
                      <BookOpen className="size-10 text-primary/40" />
                    </div>
                  )}

                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                    <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
                      {tuition.mode}
                    </span>
                    <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                      {tuition.subject}
                    </span>
                  </div>
                </div>

                <CardContent className="flex flex-1 flex-col gap-3 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      <GraduationCap className="size-3.5" />
                      {tuition.classLevel}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      <Clock className="size-3.5" />
                      {tuition.daysPerWeek > 0
                        ? `${tuition.daysPerWeek} days/week`
                        : "Schedule flexible"}
                    </span>
                  </div>

                  <div>
                    <h2 className="line-clamp-2 text-base font-semibold leading-snug">
                      {tuition.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {tuition.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-auto space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <UserRound className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {tuition.tutorName || "Verified Tutor"}
                      </span>
                    </p>
                    {tuition.location ? (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{tuition.location}</span>
                      </p>
                    ) : null}
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 shrink-0" />
                      Saved {formatDate(tuition.savedAt)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-3 border-t pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Monthly fee
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {formatFee(tuition.monthlyFee)}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          /month
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailTarget(tuition)}
                        className="gap-1.5"
                      >
                        <Eye className="size-4" />
                        Details
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        aria-label={`Remove ${tuition.title} from saved tuitions`}
                        title="Remove from saved"
                        disabled={removingId === tuition.id}
                        onClick={() => setRemoveTarget(tuition)}
                      >
                        {removingId === tuition.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {detailTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={detailsTitleId}
        >
          <button
            type="button"
            aria-label="Close tuition details"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDetailTarget(null)}
          />

          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 text-card-foreground shadow-xl ring-1 ring-foreground/10">
            {detailTarget.bannerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detailTarget.bannerImage}
                alt={detailTarget.title}
                className="mb-5 h-48 w-full rounded-lg object-cover"
              />
            ) : null}

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2
                  id={detailsTitleId}
                  className="text-xl font-bold text-foreground"
                >
                  {detailTarget.title}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserRound className="size-4" />
                  {detailTarget.tutorName || "Verified Tutor"}
                  {detailTarget.tutorEmail
                    ? ` · ${detailTarget.tutorEmail}`
                    : ""}
                </p>
              </div>
              <p className="text-xl font-bold text-primary">
                {formatFee(detailTarget.monthlyFee)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  /month
                </span>
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Subject &amp; Class
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {detailTarget.subject} · {detailTarget.classLevel}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Mode &amp; Schedule
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {detailTarget.mode} · {detailTarget.daysPerWeek} days/week
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Location
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {detailTarget.location || "Not specified"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Saved on
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatDate(detailTarget.savedAt)}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-foreground">
                Description
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {detailTarget.description || "No description provided."}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setDetailTarget(null)}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRemoveTarget(detailTarget)}
                className="gap-1.5"
              >
                <Trash2 className="size-4" />
                Remove from saved
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove this saved tuition?"
        description={
          removeTarget
            ? `"${removeTarget.title}" will be removed from your saved tuitions. You can save it again later.`
            : ""
        }
        confirmLabel="Remove"
        isLoading={Boolean(removingId)}
        onConfirm={() => void handleRemove()}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
