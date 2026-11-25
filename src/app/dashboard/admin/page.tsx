"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminOverview, type AdminOverview } from "@/lib/action";
import { cn } from "@/lib/utils";

const quickLinks = [
  {
    title: "Manage Users",
    description: "Review accounts and change user roles.",
    href: "/dashboard/admin/users",
    icon: Users,
    tone: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "Manage Tuitions",
    description: "Approve or reject tutor-submitted tuitions.",
    href: "/dashboard/admin/tuitions",
    icon: BookOpen,
    tone: "bg-sky-50 text-sky-600",
  },
  {
    title: "Transactions",
    description: "View successful Stripe payments and revenue.",
    href: "/dashboard/admin/transactions",
    icon: CreditCard,
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Admin Profile",
    description: "Update your account details and photo.",
    href: "/dashboard/admin/update-profile",
    icon: UserRound,
    tone: "bg-amber-50 text-amber-600",
  },
];

function formatRevenue(amountInCents: number, currency: string) {
  const value = (Number(amountInCents) || 0) / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load admin statistics."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      try {
        const data = await getAdminOverview();
        if (!cancelled) {
          setOverview(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load admin statistics."
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
  const totalTuitions = stats?.totalTuitions ?? 0;

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      hint: stats
        ? `${stats.totalStudents} student${
            stats.totalStudents === 1 ? "" : "s"
          } · ${stats.totalAdmins} admin${
            stats.totalAdmins === 1 ? "" : "s"
          }`
        : "All registered accounts",
      icon: Users,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Total Tutors",
      value: stats?.totalTutors ?? 0,
      hint: "Registered tutor accounts",
      icon: GraduationCap,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Pending Tuitions",
      value: stats?.pendingTuitions ?? 0,
      hint: "Awaiting moderation",
      icon: Clock,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Approved Tuitions",
      value: stats?.approvedTuitions ?? 0,
      hint: stats
        ? `${stats.rejectedTuitions} rejected`
        : "Visible on Browse Tuitions",
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Stripe Revenue",
      value: formatRevenue(
        stats?.totalRevenue ?? 0,
        stats?.currency ?? "usd"
      ),
      hint: stats
        ? `${stats.completedPayments} successful payment${
            stats.completedPayments === 1 ? "" : "s"
          }`
        : "Completed payments only",
      icon: DollarSign,
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  const moderationRows = [
    {
      label: "Pending",
      count: stats?.pendingTuitions ?? 0,
      barClassName: "bg-amber-500",
    },
    {
      label: "Approved",
      count: stats?.approvedTuitions ?? 0,
      barClassName: "bg-emerald-500",
    },
    {
      label: "Rejected",
      count: stats?.rejectedTuitions ?? 0,
      barClassName: "bg-rose-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Admin Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-wide counts for users, tuition moderation, and Stripe
            revenue.
          </p>
        </div>

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

      {isLoading ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-5">
                  <Skeleton className="size-10 rounded-lg" />
                  <Skeleton className="mt-4 h-3 w-24" />
                  <Skeleton className="mt-2 h-7 w-16" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Card>
              <CardContent className="space-y-5 p-5">
                <Skeleton className="h-4 w-40" />
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 p-5">
                <Skeleton className="h-4 w-32" />
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : error ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <h2 className="mt-3 text-base font-semibold">
              Could not load admin statistics
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {error}
            </p>
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {card.hint}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
                <div>
                  <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <ShieldCheck className="size-4 text-primary" />
                    Tuition Moderation
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Pending vs approved across {totalTuitions} tuition
                    {totalTuitions === 1 ? "" : "s"}
                  </p>
                </div>
                <Link
                  href="/dashboard/admin/tuitions"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                >
                  Review
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <div className="space-y-5 p-5">
                {moderationRows.map((row) => {
                  const percentage =
                    totalTuitions > 0
                      ? Math.round((row.count / totalTuitions) * 100)
                      : 0;

                  return (
                    <div key={row.label}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">
                          {row.label}
                        </span>
                        <span className="text-muted-foreground">
                          {row.count} · {percentage}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            row.barClassName
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {totalTuitions === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No tuitions have been submitted yet.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Quick Links
                </h2>
                <p className="text-xs text-muted-foreground">
                  Jump to the admin tools you use most
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
