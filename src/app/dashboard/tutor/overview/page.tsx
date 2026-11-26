"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Crown,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";

import {
  getTutorOverview,
  type Application,
  type TutorOverview,
  type Tuition,
} from "@/lib/action";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

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

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
        statusStyles[status] ?? "bg-slate-50 text-slate-700 ring-slate-200"
      )}
    >
      {status}
    </span>
  );
}

export default function TutorOverviewPage() {
  const [overview, setOverview] = useState<TutorOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getTutorOverview();
      setOverview(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      try {
        const data = await getTutorOverview();
        if (!cancelled) {
          setOverview(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load your dashboard."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = overview?.stats;
  const recentTuitions: Tuition[] = overview?.recentTuitions ?? [];
  const recentApplicants: Application[] = overview?.recentApplicants ?? [];

  const statCards = [
    {
      label: "Posts Used",
      value:
        stats?.tuitionLimit === null
          ? `${stats?.totalTuitions ?? 0}`
          : `${stats?.totalTuitions ?? 0}/${stats?.tuitionLimit ?? 2}`,
      icon: BookOpen,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Accepted Applicants",
      value: stats?.acceptedApplications ?? 0,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Active Tuitions",
      value: stats?.approvedActiveTuitions ?? 0,
      icon: Users,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Current Plan",
      value: stats?.plan === "pro" ? "Pro" : "Free",
      icon: Crown,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tutor Overview</h1>
          <p className="mt-1 text-xs text-slate-500">
            A quick look at your tuitions, applicants, and current plan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/tutor/post-tuition"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Post Tuition
          </Link>
          <Link
            href="/dashboard/tutor/my-tuitions"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <BookOpen className="h-4 w-4" />
            My Tuitions
          </Link>
        </div>
      </div>

      {!isLoading && !error && stats?.plan !== "pro" ? (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">Free plan</p>
            <p className="text-xs text-amber-800">
              Upgrade to Pro to post unlimited tuitions.
            </p>
          </div>
          <Link
            href="/dashboard/tutor/post-tuition"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-3 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            <Crown className="h-4 w-4" />
            View Pro options
          </Link>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border bg-white p-5"
              >
                <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
                <div className="mt-4 h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border bg-white p-5"
              >
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="mt-5 space-y-4">
                  {Array.from({ length: 4 }).map((__, row) => (
                    <div
                      key={row}
                      className="h-12 w-full animate-pulse rounded-lg bg-slate-100"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-xl border bg-white p-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-slate-900">
            Could not load your dashboard
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void refreshOverview()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-xl border bg-white p-5"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      card.tone
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-xs font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="overflow-hidden rounded-xl border bg-white">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Recent Tuitions
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your latest posted tuitions
                  </p>
                </div>
                <Link
                  href="/dashboard/tutor/my-tuitions"
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recentTuitions.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    No tuitions posted yet
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
                    Post your first tuition to start receiving applications.
                  </p>
                  <Link
                    href="/dashboard/tutor/post-tuition"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    Post Tuition
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {recentTuitions.map((tuition) => (
                    <Link
                      key={tuition.id}
                      href={`/dashboard/tutor/my-tuitions/${tuition.id}`}
                      className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {tuition.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {tuition.subject} · {tuition.classLevel}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Posted {formatDate(tuition.createdAt)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusBadge
                          status={tuition.approvalStatus || "pending"}
                        />
                        <span className="text-xs font-medium text-slate-600">
                          ${Number(tuition.monthlyFee || 0).toLocaleString()}/mo
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border bg-white">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Recent Applicants
                  </h2>
                  <p className="text-xs text-slate-500">
                    Students who applied recently
                  </p>
                </div>
                <Link
                  href="/dashboard/tutor/applicants"
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recentApplicants.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    No applicants yet
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
                    Applications will appear here once students apply to your
                    tuitions.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {recentApplicants.map((application) => (
                    <div
                      key={application.id}
                      className={cn(
                        "flex items-start justify-between gap-3 px-5 py-4",
                        application.studentIsPro && "bg-amber-50/60"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-1.5 truncate text-sm font-medium text-slate-900">
                          {application.studentName}
                          {application.studentIsPro ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-200">
                              <Crown className="h-3 w-3" />
                              Pro
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {application.studentEmail}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          Applied to {application.tuitionTitle}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusBadge status={application.status || "pending"} />
                        <span className="text-xs text-slate-400">
                          {formatDate(application.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
