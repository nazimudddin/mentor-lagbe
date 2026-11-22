"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { getTutorApplications, type Application } from "@/lib/action";
import { updateApplicationStatus } from "@/lib/mutation";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

type UpdatingState = {
  id: string;
  status: "accepted" | "rejected";
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

export default function ApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<UpdatingState | null>(null);

  const refreshApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getTutorApplications();
      setApplications(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load applications."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadApplications = async () => {
      try {
        const data = await getTutorApplications();
        if (!cancelled) {
          setApplications(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load applications."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleStatus = async (
    application: Application,
    status: "accepted" | "rejected"
  ) => {
    if (updating) return;

    setUpdating({ id: application.id, status });

    try {
      const updated = await updateApplicationStatus(application.id, status);
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(
        status === "accepted"
          ? "Application accepted."
          : "Application rejected."
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update application status."
      );
    } finally {
      setUpdating(null);
    }
  };

  const pendingCount = applications.filter(
    (application) => application.status === "pending"
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Applicants</h1>
          <p className="mt-1 text-xs text-slate-500">
            Review students who applied to your tuitions.
          </p>
          {!isLoading && !error && applications.length > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              {applications.length} total · {pendingCount} pending review
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void refreshApplications()}
          disabled={isLoading}
          aria-label="Refresh applicants"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="border-b bg-slate-50 px-5 py-3">
              <div className="h-3 w-48 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="ml-auto h-6 w-20 animate-pulse rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border bg-white p-8 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">
              Could not load applicants
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void refreshApplications()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
              <Users className="h-6 w-6" />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">
              No applicants yet
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              When students apply to your tuitions, their applications will
              appear here for review.
            </p>
            <Link
              href="/dashboard/tutor/my-tuitions"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View My Tuitions
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Applicant</th>
                    <th className="px-5 py-3 font-medium">Tuition</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">
                      Preferred Schedule
                    </th>
                    <th className="px-5 py-3 font-medium">Student Note</th>
                    <th className="px-5 py-3 font-medium">Applied On</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {applications.map((application) => {
                    const status = application.status || "pending";
                    const isUpdating = updating?.id === application.id;

                    return (
                      <tr
                        key={application.id}
                        className="align-top hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {application.studentName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {application.studentEmail || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[220px] truncate text-slate-800">
                            {application.tuitionTitle || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {application.studentPhone || "—"}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {application.preferredSchedule || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <p
                            className="max-w-[240px] truncate text-slate-600"
                            title={application.note || undefined}
                          >
                            {application.note || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                          {formatDate(application.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
                              statusStyles[status] ??
                                "bg-slate-50 text-slate-700 ring-slate-200"
                            )}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {status === "pending" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleStatus(application, "accepted")
                                }
                                disabled={Boolean(updating)}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdating && updating?.status === "accepted" ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Accept
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleStatus(application, "rejected")
                                }
                                disabled={Boolean(updating)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdating && updating?.status === "rejected" ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <X className="h-3.5 w-3.5" />
                                )}
                                Reject
                              </button>
                            </div>
                          ) : (
                            <p className="text-right text-xs text-slate-400">
                              Reviewed
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
