"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminTuitions,
  type ApprovalStatus,
  type Tuition,
} from "@/lib/action";
import { updateTuitionApproval } from "@/lib/mutation";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ApprovalStatus;

type UpdatingState = {
  id: string;
  status: "approved" | "rejected";
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function formatFee(value: number) {
  if (!Number.isFinite(value)) return "—";
  return `$${value.toLocaleString()}`;
}

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

export default function AdminTuitionsPage() {
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [updating, setUpdating] = useState<UpdatingState | null>(null);

  const loadTuitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAdminTuitions();
      setTuitions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load tuitions."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getAdminTuitions();
        if (!cancelled) {
          setTuitions(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load tuitions."
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

  const counts = useMemo(() => {
    return tuitions.reduce(
      (result, tuition) => {
        const status = tuition.approvalStatus || "pending";
        result[status] += 1;
        return result;
      },
      { pending: 0, approved: 0, rejected: 0 } as Record<
        ApprovalStatus,
        number
      >
    );
  }, [tuitions]);

  const filteredTuitions = useMemo(() => {
    if (filter === "all") return tuitions;
    return tuitions.filter(
      (tuition) => (tuition.approvalStatus || "pending") === filter
    );
  }, [tuitions, filter]);

  const handleApproval = async (
    tuition: Tuition,
    status: "approved" | "rejected"
  ) => {
    if (updating) return;

    setUpdating({ id: tuition.id, status });

    try {
      const updated = await updateTuitionApproval(tuition.id, status);
      setTuitions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );

      toast.success(
        status === "approved"
          ? `"${tuition.title}" approved. It is now visible on Browse Tuitions.`
          : `"${tuition.title}" rejected. It is no longer visible publicly.`
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update tuition status."
      );
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Tuition Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review every tutor-submitted tuition and approve or reject posts
            before they appear on Browse Tuitions.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void loadTuitions()}
          disabled={isLoading}
          className="w-fit gap-1.5"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {filterOptions.map((option) => {
          const count =
            option.value === "all"
              ? tuitions.length
              : counts[option.value];
          const isActive = filter === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilter(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {option.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isActive ? "bg-primary-foreground/20" : "bg-muted"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <Card className="overflow-hidden">
            <div className="border-b bg-muted/50 px-5 py-3">
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-7 w-32 rounded-lg" />
                </div>
              ))}
            </div>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-6" />
              </span>
              <h2 className="mt-3 text-base font-semibold">
                Could not load tuitions
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {error}
              </p>
              <Button
                variant="outline"
                onClick={() => void loadTuitions()}
                className="mt-4 gap-1.5"
              >
                <RefreshCw className="size-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : filteredTuitions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="size-6" />
              </span>
              <h2 className="mt-3 text-base font-semibold">
                {tuitions.length === 0
                  ? "No tuitions submitted yet"
                  : `No ${filter} tuitions`}
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {tuitions.length === 0
                  ? "Tutor-submitted tuitions will appear here for moderation."
                  : "Try another approval filter to see the other tuitions."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden pt-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Tuition</th>
                    <th className="px-5 py-3 font-medium">Subject</th>
                    <th className="px-5 py-3 font-medium">Tutor</th>
                    <th className="px-5 py-3 font-medium">Monthly Fee</th>
                    <th className="px-5 py-3 font-medium">Mode</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredTuitions.map((tuition) => {
                    const status = tuition.approvalStatus || "pending";
                    const isRowUpdating = updating?.id === tuition.id;

                    return (
                      <tr key={tuition.id} className="hover:bg-muted/40">
                        <td className="px-5 py-4">
                          <p className="max-w-[280px] truncate font-medium text-foreground">
                            {tuition.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            Submitted {formatDate(tuition.createdAt)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-foreground">{tuition.subject}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {tuition.classLevel}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[220px] truncate text-foreground">
                            {tuition.tutorName || "Unknown tutor"}
                          </p>
                          <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">
                            {tuition.tutorEmail || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-medium text-foreground">
                          {formatFee(tuition.monthlyFee)}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            /month
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {tuition.mode}
                          </span>
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
                          {tuition.isActive === false ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Inactive by tutor
                            </p>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isRowUpdating || status === "approved"}
                              onClick={() =>
                                void handleApproval(tuition, "approved")
                              }
                              className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                            >
                              {isRowUpdating &&
                              updating?.status === "approved" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isRowUpdating || status === "rejected"}
                              onClick={() =>
                                void handleApproval(tuition, "rejected")
                              }
                              className="gap-1 border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            >
                              {isRowUpdating &&
                              updating?.status === "rejected" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <X className="size-3.5" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
