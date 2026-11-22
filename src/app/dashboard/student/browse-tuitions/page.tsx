import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  SearchX,
  X,
} from "lucide-react";

import { TuitionCard } from "@/components/tuitions/tuition-card";
import {
  TuitionFilters,
  type TuitionFilterValues,
} from "@/components/tuitions/tuition-filters";
import { buttonVariants } from "@/components/ui/button";
import { getApprovedTuitions, type Tuition } from "@/lib/action";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Browse Tuitions | MentorLagbe",
  description:
    "Search approved tuitions by title, subject, class level, mode, and monthly fee.",
};

const BROWSE_PATH = "/dashboard/student/browse-tuitions";

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

export default async function BrowseTuitionsPage({
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

  let allTuitions: Tuition[] = [];
  let error: string | null = null;

  try {
    allTuitions = await getApprovedTuitions({
  q,
  subject,
  classLevel,
  mode,
  minFee: minFeeValue,
  maxFee: maxFeeValue,
});
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Failed to load tuitions.";
  }

  const subjects = uniqueSorted(allTuitions.map((tuition) => tuition.subject));
  const classLevels = uniqueSorted(
    allTuitions.map((tuition) => tuition.classLevel)
  );

  const normalizedQuery = q.toLowerCase();
  const normalizedSubject = subject.toLowerCase();
  const normalizedClassLevel = classLevel.toLowerCase();
  const normalizedMode = mode.toLowerCase();

 const filteredTuitions = allTuitions;
  const initialFilterValues: TuitionFilterValues = {
    q: readParam(params.q),
    subject,
    classLevel,
    mode,
    minFee: minFeeValue,
    maxFee: maxFeeValue,
  };

  const activeFilterCount = [
    q,
    subject,
    classLevel,
    mode,
    minFeeValue,
    maxFeeValue,
  ].filter((value) => value.trim().length > 0).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <BookOpen className="size-3.5" />
          Student catalog
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Browse Tuitions
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Explore approved tuitions, compare monthly fees, and apply to the ones
          that match your goals.
        </p>
      </header>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <TuitionFilters
          initialValues={initialFilterValues}
          subjects={subjects}
          classLevels={classLevels}
        />

        <section
          aria-labelledby="tuition-results-heading"
          className="min-w-0"
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="tuition-results-heading"
                className="text-lg font-semibold"
              >
                Available Tuitions
              </h2>
              <p className="text-sm text-muted-foreground">
                {error
                  ? "We could not load tuitions right now."
                  : `${filteredTuitions.length} tuition${
                      filteredTuitions.length === 1 ? "" : "s"
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
            <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
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
          ) : filteredTuitions.length === 0 ? (
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
                  ? "No tuitions available yet"
                  : "No tuitions match your filters"}
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {allTuitions.length === 0
                  ? "Approved tuitions will appear here as soon as tutors publish them."
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
              {filteredTuitions.map((tuition) => (
                <TuitionCard key={tuition.id} tuition={tuition} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
