"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  Crown,
  GraduationCap,
  Loader2,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { createProCheckout } from "@/lib/mutation";
import { cn } from "@/lib/utils";

type PlanId = "student_pro" | "tutor_pro";
type PlanRole = "student" | "tutor";

type Plan = {
  id: PlanId;
  role: PlanRole;
  name: string;
  price: number;
  tagline: string;
  icon: typeof GraduationCap;
  accent: string;
  bar: string;
  freeFeatures: string[];
  proFeatures: string[];
};

const plans: Plan[] = [
  {
    id: "student_pro",
    role: "student",
    name: "Student Pro",
    price: 10,
    tagline: "More visibility, unlimited bookmarks, and a Pro badge.",
    icon: GraduationCap,
    accent: "bg-indigo-50 text-indigo-600",
    bar: "bg-indigo-500",
    freeFeatures: [
      "Browse and apply to unlimited tuitions",
      "Track and cancel your applications",
      "Save up to 5 tuitions",
    ],
    proFeatures: [
      "Everything in Student Free",
      "Unlimited saved tuitions",
      "Priority booking for your applications",
      "Pro badge on your profile",
    ],
  },
  {
    id: "tutor_pro",
    role: "tutor",
    name: "Tutor Pro",
    price: 15,
    tagline: "Post as many tuitions as you need, with no monthly fee.",
    icon: Users,
    accent: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-500",
    freeFeatures: [
      "Post up to 2 tuitions",
      "Manage incoming student applicants",
      "Accept or reject applications",
    ],
    proFeatures: [
      "Everything in Tutor Free",
      "Unlimited tuition posts",
      "One-time payment — no subscription",
    ],
  },
];

type ActionStatus =
  | "checking"
  | "guest"
  | "admin"
  | "wrong-role"
  | "current"
  | "upgrade";

function FeatureList({
  title,
  features,
  iconClassName,
}: {
  title: string;
  features: string[];
  iconClassName: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              className={cn("mt-0.5 size-4 shrink-0", iconClassName)}
            />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanAction({
  plan,
  status,
  isCheckingOut,
  isBusy,
  onUpgrade,
}: {
  plan: Plan;
  status: ActionStatus;
  isCheckingOut: boolean;
  isBusy: boolean;
  onUpgrade: () => void;
}) {
  if (status === "checking") {
    return <Skeleton className="h-10 w-full rounded-lg" />;
  }

  if (status === "guest") {
    return (
      <Link
        href={`/sign-in?next=${encodeURIComponent("/pricing")}`}
        className={cn(buttonVariants({ size: "lg" }), "h-10 w-full")}
      >
        <LogIn />
        Sign in to upgrade
      </Link>
    );
  }

  if (status === "admin") {
    return (
      <Button size="lg" variant="outline" disabled className="h-10 w-full">
        <LockKeyhole />
        Admin accounts don&apos;t need Pro
      </Button>
    );
  }

  if (status === "wrong-role") {
    return (
      <Button size="lg" variant="outline" disabled className="h-10 w-full">
        <LockKeyhole />
        Available for {plan.role}s only
      </Button>
    );
  }

  if (status === "current") {
    return (
      <Button size="lg" variant="secondary" disabled className="h-10 w-full">
        <Check />
        Current plan
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      onClick={onUpgrade}
      disabled={isBusy}
      className="h-10 w-full gap-2"
    >
      {isCheckingOut ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Crown />
      )}
      {isCheckingOut
        ? "Redirecting to Stripe…"
        : `Upgrade for $${plan.price}`}
    </Button>
  );
}

export function PricingPlans() {
  const { data: session, isPending } = authClient.useSession();
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);

  const user = session?.user as
    | { name?: string; role?: string; plan?: string }
    | undefined;
  const role = user?.role;
  const isPro = user?.plan === "pro";

  const handleUpgrade = async (planId: PlanId) => {
    if (checkoutPlan) return;

    setCheckoutPlan(planId);

    try {
      const { url } = await createProCheckout(planId);
      if (!url) throw new Error("Stripe did not return a checkout URL.");
      window.location.assign(url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout."
      );
      setCheckoutPlan(null);
    }
  };

  const getStatus = (plan: Plan): ActionStatus => {
    if (isPending) return "checking";
    if (!session) return "guest";
    if (role === "admin") return "admin";
    if (role !== plan.role) return "wrong-role";
    if (isPro) return "current";
    return "upgrade";
  };

  return (
    <div>
      {session ? (
        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2 rounded-full border bg-card px-4 py-2 text-xs text-muted-foreground">
          <span>
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {user?.name || "your account"}
            </span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{role || "student"}</span>
          <span aria-hidden="true">·</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              isPro ? "text-emerald-600" : "text-muted-foreground"
            )}
          >
            {isPro ? <Crown className="size-3.5" /> : null}
            {isPro ? "Pro plan active" : "Free plan"}
          </span>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const status = getStatus(plan);

          return (
            <Card
              key={plan.id}
              className="relative flex flex-col overflow-hidden pt-0"
            >
              <div className={cn("h-1.5 w-full", plan.bar)} />

              <CardContent className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-lg",
                        plan.accent
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold">{plan.name}</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {plan.tagline}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="shrink-0 capitalize">
                    For {plan.role}s
                  </Badge>
                </div>

                <div className="mt-5 flex items-end gap-1.5">
                  <span className="text-4xl font-bold tracking-tight">
                    ${plan.price}
                  </span>
                  <span className="pb-1 text-sm text-muted-foreground">
                    one-time
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pay once. No monthly subscription or renewal.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <FeatureList
                    title="Free includes"
                    features={plan.freeFeatures}
                    iconClassName="text-muted-foreground"
                  />
                  <FeatureList
                    title="Pro adds"
                    features={plan.proFeatures}
                    iconClassName={
                      plan.role === "student"
                        ? "text-indigo-600"
                        : "text-emerald-600"
                    }
                  />
                </div>

                <div className="mt-auto pt-6">
                  <PlanAction
                    plan={plan}
                    status={status}
                    isCheckingOut={checkoutPlan === plan.id}
                    isBusy={checkoutPlan !== null}
                    onUpgrade={() => void handleUpgrade(plan.id)}
                  />

                  <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    Secure one-time payment via Stripe.
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
