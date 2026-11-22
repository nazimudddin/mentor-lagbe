"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock,
  DollarSign,
  GraduationCap,
  Pencil,
  RefreshCw,
} from "lucide-react";

import { getTuitionById, type Tuition } from "@/lib/action";
import { cn } from "@/lib/utils";

const approvalStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
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

export default function TuitionDetails({ id }: { id: string }) {
  const [tuition, setTuition] = useState<Tuition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadTuition = async () => {
      try {
        const data = await getTuitionById(id);
        if (!cancelled) {
          setTuition(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load this tuition."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadTuition();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 rounded-xl border bg-white p-6">
          <div className="h-7 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !tuition) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/tutor/my-tuitions"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Tuitions
        </Link>

        <div className="mt-4 rounded-xl border bg-white p-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-slate-900">
            Could not load this tuition
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {error ?? "Tuition not found."}
          </p>
          <Link
            href="/dashboard/tutor/my-tuitions"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  const status = tuition.approvalStatus || "pending";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/tutor/my-tuitions"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Tuitions
        </Link>

        <Link
          href={`/dashboard/tutor/my-tuitions/${tuition.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Pencil className="h-4 w-4" />
          Edit Tuition
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border bg-white">
        {tuition.bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tuition.bannerImage}
            alt={tuition.title}
            className="h-56 w-full object-cover"
          />
        ) : null}

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {tuition.title}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Posted on {formatDate(tuition.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
                  approvalStyles[status] ??
                    "bg-slate-50 text-slate-700 ring-slate-200"
                )}
              >
                {status}
              </span>

              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                  tuition.isActive
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-slate-200"
                )}
              >
                {tuition.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-slate-50/60 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <GraduationCap className="h-3.5 w-3.5" />
                Subject &amp; Class Level
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {tuition.subject} · {tuition.classLevel}
              </p>
            </div>

            <div className="rounded-lg border bg-slate-50/60 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <DollarSign className="h-3.5 w-3.5" />
                Monthly Fee
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                ${Number(tuition.monthlyFee || 0).toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg border bg-slate-50/60 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Schedule
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {tuition.mode} · {tuition.daysPerWeek} days/week
              </p>
            </div>

            <div className="rounded-lg border bg-slate-50/60 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                Last Updated
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {formatDate(tuition.updatedAt)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-900">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
              {tuition.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
