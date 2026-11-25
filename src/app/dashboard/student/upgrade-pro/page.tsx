"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Crown,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMyPayments,
  getStudentPlan,
  verifyProPayment,
  type PaymentRecord,
  type StudentPlan,
} from "@/lib/action";
import { createProCheckout } from "@/lib/mutation";
import { cn } from "@/lib/utils";

const STUDENT_PRO_PRICE = 1000; // $10.00 in cents.

const freeFeatures = [
  "Apply to unlimited tuitions",
  "Track every application",
  "Save up to 5 tuitions",
];

const proFeatures = [
  "Everything in the Free plan",
  "Unlimited saved tuitions",
  "Pro badge on your profile",
  "Priority booking for your applications",
  "Support the platform",
];

const paymentStatusStyles: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
  refunded: "bg-slate-50 text-slate-600 ring-slate-200",
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

function formatPlanName(plan?: string) {
  if (plan === "student_pro") return "Student Pro";
  if (plan === "tutor_pro") return "Tutor Pro";
  return plan || "Pro";
}

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
        paymentStatusStyles[status] ?? "bg-slate-50 text-slate-700 ring-slate-200"
      )}
    >
      {status}
    </span>
  );
}

function PlanFeatures({
  features,
  tone = "emerald",
}: {
  features: string[];
  tone?: "emerald" | "indigo";
}) {
  const iconTone =
    tone === "indigo" ? "text-indigo-600" : "text-emerald-600";

  return (
    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2">
          <Check className={cn("mt-0.5 size-4 shrink-0", iconTone)} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function UpgradeProContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const checkoutSessionId = searchParams.get("session_id");

  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const cancelledNoticeRef = useRef(false);
  const verifiedSessionRef = useRef<string | null>(null);

  const loadPlan = useCallback(async () => {
    const data = await getStudentPlan();
    setPlan(data);
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      const data = await getMyPayments();
      setPayments(data);
    } catch {
      // Payment history is secondary; keep the upgrade UI usable.
      setPayments([]);
    }
  }, []);

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([loadPlan(), loadPayments()]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your plan details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadPlan, loadPayments]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        await Promise.all([loadPlan(), loadPayments()]);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load your plan details."
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
  }, [loadPlan, loadPayments]);

  // Handle the return trip from Stripe Checkout. The plan is only treated as
  // upgraded after the backend verifies the session with Stripe.
  useEffect(() => {
    if (paymentStatus === "cancelled") {
      if (!cancelledNoticeRef.current) {
        cancelledNoticeRef.current = true;
        toast.info("Payment cancelled. You are still on the Free plan.");
      }
      router.replace("/dashboard/student/upgrade-pro");
      return;
    }

    if (
      paymentStatus !== "success" ||
      !checkoutSessionId ||
      verifiedSessionRef.current === checkoutSessionId
    ) {
      return;
    }

    let cancelled = false;

    const verifyPayment = async () => {
      setIsVerifying(true);

      try {
        await verifyProPayment(checkoutSessionId);
        if (cancelled) return;

        verifiedSessionRef.current = checkoutSessionId;
        toast.success("Welcome to Student Pro! Your plan is now active.");
        await Promise.all([loadPlan(), loadPayments()]);
        router.replace("/dashboard/student/upgrade-pro");
      } catch (err) {
        if (cancelled) return;

        toast.error(
          err instanceof Error
            ? err.message
            : "We could not verify your payment. Please try again."
        );
      } finally {
        if (!cancelled) setIsVerifying(false);
      }
    };

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [
    paymentStatus,
    checkoutSessionId,
    router,
    loadPlan,
    loadPayments,
  ]);

  const handleUpgrade = async () => {
    if (isUpgrading || isVerifying) return;

    setIsUpgrading(true);

    try {
      const { url } = await createProCheckout("student_pro");
      if (!url) throw new Error("Stripe did not return a checkout URL.");
      window.location.href = url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start checkout."
      );
      setIsUpgrading(false);
    }
  };

  const priceLabel = `$${(
    (plan?.price ?? STUDENT_PRO_PRICE) / 100
  ).toFixed(0)}`;
  const isPro = Boolean(plan?.isPro);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Student Pro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade once for {priceLabel} and stand out to tutors.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void loadPage()}
          disabled={isLoading}
          className="w-fit gap-1.5"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="space-y-4 p-6">
                  <Skeleton className="size-10 rounded-lg" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-20" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((__, row) => (
                      <Skeleton key={row} className="h-4 w-full" />
                    ))}
                  </div>
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : error ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <h2 className="mt-3 text-base font-semibold">
              Could not load your plan
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {error}
            </p>
            <Button
              variant="outline"
              onClick={() => void loadPage()}
              className="mt-4 gap-1.5"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          {isPro ? (
            <section className="relative overflow-hidden rounded-xl border-2 border-emerald-500 bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Crown className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      You&apos;re a Pro student
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your Pro badge, unlimited saved tuitions, and priority
                      booking are active. Thanks for supporting MentorLagbe.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <Check className="size-3.5" />
                        Status: Active
                      </span>
                      {plan?.since ? (
                        <span>Member since {formatDate(plan.since)}</span>
                      ) : null}
                      <span>No expiry (one-time purchase)</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-fit gap-1.5"
                  render={
                    <Link href="/dashboard/student/overview" />
                  }
                >
                  Back to overview
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {proFeatures.slice(1).map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Sparkles className="size-4 shrink-0 text-indigo-600" />
                    {feature}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              <Card className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Zap className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        Free
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        For getting started
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-3xl font-bold text-foreground">
                    $0
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      forever
                    </span>
                  </p>

                  <PlanFeatures features={freeFeatures} />

                  <Button
                    variant="outline"
                    disabled
                    className="mt-6 w-full"
                  >
                    Current plan
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative flex flex-col border-2 border-indigo-500 shadow-sm">
                <span className="absolute -top-3 right-5 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Best value
                </span>

                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Crown className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        Student Pro
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Stand out to tutors
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-3xl font-bold text-foreground">
                    {priceLabel}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      one-time
                    </span>
                  </p>

                  <PlanFeatures features={proFeatures} tone="indigo" />

                  <Button
                    onClick={() => void handleUpgrade()}
                    disabled={isUpgrading || isVerifying}
                    className="mt-6 w-full gap-2"
                  >
                    {isUpgrading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Crown className="size-4" />
                    )}
                    {isUpgrading
                      ? "Redirecting to Stripe…"
                      : "Upgrade to Pro"}
                  </Button>

                  <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    Secure payment by Stripe. Test mode enabled.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <section className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                Payment History
              </h2>
              <p className="text-xs text-muted-foreground">
                Your most recent Student Pro transactions
              </p>
            </div>

            {payments.length === 0 ? (
              <div className="p-8 text-center">
                <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <Crown className="size-5" />
                </span>
                <p className="mt-3 text-sm font-semibold">
                  No payments yet
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                  Your transactions will appear here after a successful
                  checkout.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {formatPlanName(payment.plan)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(
                          payment.completedAt || payment.createdAt
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <PaymentStatusBadge status={payment.status} />
                      <span className="text-xs font-semibold text-foreground">
                        ${((payment.amount ?? 0) / 100).toFixed(2)}{" "}
                        <span className="font-normal uppercase text-muted-foreground">
                          {payment.currency || "usd"}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="text-center text-xs text-muted-foreground">
            Payments are securely processed by Stripe. Your plan is upgraded
            only after Stripe confirms a successful payment.
          </p>
        </div>
      )}
    </div>
  );
}

export default function UpgradeProPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      }
    >
      <UpgradeProContent />
    </Suspense>
  );
}
