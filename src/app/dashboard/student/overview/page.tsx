"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getStudentOverview,
  type Application,
  type StudentOverview,
} from "@/lib/action";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  withdrawn: "bg-slate-50 text-slate-600 ring-slate-200",
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

const quickLinks = [
  {
    title: "Browse Tuitions",
    description: "Find approved tuitions that match your goals.",
    href: "/dashboard/student/browse-tuitions",
    icon: BookOpen,
    tone: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "My Applications",
    description: "Track pending, accepted, and rejected applications.",
    href: "/dashboard/student/my-applications",
    icon: FileText,
    tone: "bg-sky-50 text-sky-600",
  },
  {
    title: "Saved Tuitions",
    description: "Revisit the tuitions you bookmarked.",
    href: "/dashboard/student/saved-tuitions",
    icon: Bookmark,
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Update Profile",
    description: "Keep your contact details up to date.",
    href: "/dashboard/student/update-profile",
    icon: UserRound,
    tone: "bg-amber-50 text-amber-600",
  },
];

export default function StudentOverviewPage() {
  const { data: session } = authClient.useSession();
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getStudentOverview();
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
        const data = await getStudentOverview();
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
  const recentApplications: Application[] = overview?.recentApplications ?? [];
  const firstName = session?.user?.name?.split(" ")[0];

  const statCards = [
    {
      label: "Total Applications",
      value: stats?.totalApplications ?? 0,
      icon: FileText,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Pending",
      value: stats?.pendingApplications ?? 0,
      icon: Clock,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Accepted",
      value: stats?.acceptedApplications ?? 0,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Saved Tuitions",
      value: stats?.savedTuitions ?? 0,
      icon: Bookmark,
      tone: "bg-sky-50 text-sky-600",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {firstName ? `Welcome back, ${firstName}` : "Student Overview"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A quick look at your applications, saved tuitions, and next steps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats?.plan === "pro" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <Crown className="size-3.5" />
              Pro member
            </span>
          ) : (
            <Button
              className="gap-1.5"
              render={
                <Link href="/dashboard/student/upgrade-pro" />
              }
            >
              <Crown className="size-4" />
              Upgrade to Pro
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => void refreshOverview()}
            disabled={isLoading}
            className="w-fit gap-1.5"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-5">
                  <Skeleton className="size-10 rounded-lg" />
                  <Skeleton className="mt-4 h-3 w-24" />
                  <Skeleton className="mt-2 h-7 w-14" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Card>
              <CardContent className="space-y-4 p-5">
                <Skeleton className="h-4 w-40" />
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 p-5">
                <Skeleton className="h-4 w-32" />
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : error ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <h2 className="mt-3 text-base font-semibold">
              Could not load your dashboard
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              onClick={() => void refreshOverview()}
              className="mt-4 gap-1.5"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <Card key={card.label}>
                  <CardContent className="p-5">
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        card.tone
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <p className="mt-4 text-xs font-medium text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {card.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Recent Applications
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Your latest tuition applications
                  </p>
                </div>
                <Link
                  href="/dashboard/student/my-applications"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                >
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {recentApplications.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">
                    No applications yet
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    Browse approved tuitions and apply to start tracking your
                    progress here.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 gap-1.5"
                    render={
                      <Link href="/dashboard/student/browse-tuitions" />
                    }
                  >
                    <BookOpen className="size-4" />
                    Browse Tuitions
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-start justify-between gap-3 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {application.tuitionTitle}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {application.tutorName ||
                            application.tutorEmail ||
                            "Unknown tutor"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                          Applied {formatDate(application.createdAt)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusBadge status={application.status} />
                        <span className="text-xs font-medium text-muted-foreground">
                          ৳
                          {Number(application.monthlyFee || 0).toLocaleString()}
                          /mo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Quick Links
                </h2>
                <p className="text-xs text-muted-foreground">
                  Jump to the tools you use most
                </p>
              </div>

              <div className="divide-y">
                {quickLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 px-5 py-4 transition hover:bg-muted/50"
                    >
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg",
                          link.tone
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {link.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {link.description}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
