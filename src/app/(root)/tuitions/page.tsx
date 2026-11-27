import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  SearchX,
  Sparkles,
  X,
} from "lucide-react";

import { PublicApplyAction } from "@/components/tuitions/public-apply-action";
import { TuitionCard } from "@/components/tuitions/tuition-card";
import {
  TuitionFilters,
  type TuitionFilterValues,
} from "@/components/tuitions/tuition-filters";
import { buttonVariants } from "@/components/ui/button";
import {
  getApprovedTuitions,
  type Tuition,
  type TuitionSearchParams,
} from "@/lib/action";
import { cn } from "@/lib/utils";

// The shared footer reads the current year during render, which is not allowed
// during prerender validation. This route always renders live, filtered data.
export const instant = false;

export const metadata: Metadata = {
  title: "Browse Tuitions | MentorLagbe",
  description:
    "Browse approved and active tuitions. Search by title and filter by subject, class level, mode, and monthly fee.",
};

const BROWSE_PATH = "/tuitions";

type BrowseSearchParams = {
  q?: string | string[];
  subject?: string | string[];
  classLevel?: string | string[];
  mode?: string | string[];
  minFee?: string | string[];
  maxFee?: string | string[];
};

function readParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parseFee(value: string) {
  if (!value.trim()) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export default async function PublicTuitionsPage({
  searchParams,
}: {
  searchParams: Promise<BrowseSearchParams>;
}) {
  const params = await searchParams;

  const q = readParam(params.q).trim();
  const subject = readParam(params.subject);
  const classLevel = readParam(params.classLevel);
  const mode = readParam(params.mode);
  const minFeeValue = readParam(params.minFee);
  const maxFeeValue = readParam(params.maxFee);
  const minFee = parseFee(minFeeValue);
  const maxFee = parseFee(maxFeeValue);

  const filters: TuitionSearchParams = {
    q: q || undefined,
    subject: subject || undefined,
    classLevel: classLevel || undefined,
    mode: mode || undefined,
    minFee: minFee !== undefined ? String(minFee) : undefined,
    maxFee: maxFee !== undefined ? String(maxFee) : undefined,
  };

  const hasFilters = Boolean(
    filters.q ||
      filters.subject ||
      filters.classLevel ||
      filters.mode ||
      filters.minFee ||
      filters.maxFee
  );

  let allTuitions: Tuition[] = [];
  let tuitions: Tuition[] = [];
  let error: string | null = null;

  try {
    // Fetch the unfiltered list once so filter options stay complete even when
    // a filter is active. With no filters the same response is reused.
    const [all, filtered] = await Promise.all([
      getApprovedTuitions(),
      hasFilters ? getApprovedTuitions(filters) : Promise.resolve(null),
    ]);

    allTuitions = all;
    tuitions = filtered ?? all;
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Failed to load tuitions.";
  }

  const subjects = uniqueSorted(allTuitions.map((tuition) => tuition.subject));
  const classLevels = uniqueSorted(
    allTuitions.map((tuition) => tuition.classLevel)
  );

  const initialFilterValues: TuitionFilterValues = {
    q: readParam(params.q),
    subject,
    classLevel,
    mode,
    minFee: minFeeValue,
    maxFee: maxFeeValue,
  };

  const activeFilterCount = [
    filters.q,
    filters.subject,
    filters.classLevel,
    filters.mode,
    filters.minFee,
    filters.maxFee,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          Public tuition catalog
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Find the right tuition
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Every tuition below has been approved by our team and is currently
          active. Search by title or narrow the list by subject, class, mode,
          and monthly fee.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <TuitionFilters
          initialValues={initialFilterValues}
          subjects={subjects}
          classLevels={classLevels}
          basePath={BROWSE_PATH}
        />

        <section
          aria-labelledby="public-tuition-results-heading"
          className="min-w-0"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="public-tuition-results-heading"
                className="text-lg font-semibold"
              >
                Available tuitions
              </h2>
              <p className="text-sm text-muted-foreground">
                {error
                  ? "We could not load tuitions right now."
                  : `${tuitions.length} tuition${
                      tuitions.length === 1 ? "" : "s"
                    } found`}
              </p>
            </div>

            {!error && activeFilterCount > 0 ? (
              <Link
                href={BROWSE_PATH}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground"
                )}
              >
                <X />
                Clear filters
              </Link>
            ) : null}
          </div>

          {error ? (
            <div
              role="alert"
              className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-6" />
              </span>
              <h3 className="mt-3 text-base font-semibold">
                Could not load tuitions
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {error}
              </p>
              <Link
                href={BROWSE_PATH}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-4"
                )}
              >
                Try again
              </Link>
            </div>
          ) : tuitions.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {allTuitions.length === 0 ? (
                  <BookOpen className="size-6" />
                ) : (
                  <SearchX className="size-6" />
                )}
              </span>
              <h3 className="mt-3 text-base font-semibold">
                {allTuitions.length === 0
                  ? "No approved tuitions yet"
                  : "No tuitions match your filters"}
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {allTuitions.length === 0
                  ? "Approved and active tuitions will appear here as soon as tutors publish them."
                  : "Try a different title, subject, class level, mode, or fee range."}
              </p>
              {allTuitions.length > 0 && activeFilterCount > 0 ? (
                <Link
                  href={BROWSE_PATH}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-4"
                  )}
                >
                  Clear all filters
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {tuitions.map((tuition) => (
                <TuitionCard
                  key={tuition.id}
                  tuition={tuition}
                  detailsHref={null}
                  applyAction={
                    <PublicApplyAction
                      tuitionId={tuition.id}
                      tuitionTitle={tuition.title}
                    />
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
