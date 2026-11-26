"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getMyTuitions, type Tuition } from "@/lib/action";
import { deleteTuition, toggleTuitionActive } from "@/lib/mutation";
import { cn } from "@/lib/utils";

const approvalStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

function formatFee(value: number) {
  if (!Number.isFinite(value)) return "—";
  return `$${value.toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyTuitionsPage() {
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tuition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refreshTuitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getMyTuitions();
      setTuitions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your tuitions."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTuitions = async () => {
      try {
        const data = await getMyTuitions();
        if (!cancelled) {
          setTuitions(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load your tuitions."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadTuitions();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await deleteTuition(deleteTarget.id);
      setTuitions((current) =>
        current.filter((tuition) => tuition.id !== deleteTarget.id)
      );
      toast.success("Tuition deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete tuition."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async (tuition: Tuition) => {
    setTogglingId(tuition.id);

    try {
      const updated = await toggleTuitionActive(tuition.id, !tuition.isActive);
      setTuitions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(
        `Tuition marked ${updated.isActive ? "active" : "inactive"}.`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update tuition status."
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Tuitions</h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage the tuitions you have posted. Approval status is controlled by
            the admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshTuitions()}
            disabled={isLoading}
            aria-label="Refresh tuitions"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>

          <Link
            href="/dashboard/tutor/post-tuition"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Post New Tuition
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="border-b bg-slate-50 px-5 py-3">
              <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/5 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                  <div className="ml-auto h-7 w-24 animate-pulse rounded-full bg-slate-200" />
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
              Could not load your tuitions
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void refreshTuitions()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : tuitions.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <BookOpen className="h-6 w-6" />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">
              No tuitions posted yet
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              Post your first tuition and it will appear here while it waits for
              admin approval.
            </p>
            <Link
              href="/dashboard/tutor/post-tuition"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Post New Tuition
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Tuition Title</th>
                    <th className="px-5 py-3 font-medium">
                      Subject &amp; Class Level
                    </th>
                    <th className="px-5 py-3 font-medium">Monthly Fee</th>
                    <th className="px-5 py-3 font-medium">Applicants</th>
                    <th className="px-5 py-3 font-medium">Posted</th>
                    <th className="px-5 py-3 font-medium">Approval Status</th>
                    <th className="px-5 py-3 font-medium">Active Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {tuitions.map((tuition) => {
                    const status = tuition.approvalStatus || "pending";
                    const canToggleActive = status === "approved";

                    return (
                      <tr key={tuition.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {tuition.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {tuition.mode} · {tuition.daysPerWeek} days/week
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-slate-800">{tuition.subject}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {tuition.classLevel}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-800">
                          {formatFee(tuition.monthlyFee)}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {tuition.applicationsCount ?? 0}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600">
                          {formatDate(tuition.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
                              approvalStyles[status] ??
                                "bg-slate-50 text-slate-700 ring-slate-200"
                            )}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={tuition.isActive}
                              aria-label={`Toggle ${tuition.title} active status`}
                              onClick={() => void handleToggle(tuition)}
                              disabled={togglingId === tuition.id || !canToggleActive}
                              title={
                                canToggleActive
                                  ? "Toggle active status"
                                  : "Only approved tuitions can be activated or closed"
                              }
                              className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                                tuition.isActive ? "bg-emerald-500" : "bg-slate-300"
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                                  tuition.isActive
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                )}
                              />
                            </button>

                            <span className="flex items-center gap-1 text-xs font-medium text-slate-600">
                              {togglingId === tuition.id && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              {canToggleActive
                                ? tuition.isActive
                                  ? "Active"
                                  : "Closed"
                                : "Available after approval"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/dashboard/tutor/my-tuitions/${tuition.id}`}
                              aria-label={`View details for ${tuition.title}`}
                              title="View details"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:bg-slate-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            <Link
                              href={`/dashboard/tutor/my-tuitions/${tuition.id}/edit`}
                              aria-label={`Edit ${tuition.title}`}
                              title="Edit"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 hover:bg-slate-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(tuition)}
                              aria-label={`Delete ${tuition.title}`}
                              title="Delete"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this tuition?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Tuition"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
