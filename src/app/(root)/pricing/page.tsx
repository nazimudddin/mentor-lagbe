import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  BadgeCheck,
  CreditCard,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { PricingPlans } from "@/components/pricing/pricing-plans";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// The shared footer reads the current year during render, which is not allowed
// during prerender validation. This route is a public, session-aware page.
export const instant = false;

export const metadata: Metadata = {
  title: "Pricing | MentorLagbe",
  description:
    "Compare MentorLagbe Free and Pro plans. Student Pro is $10 and Tutor Pro is $15, both one-time payments through Stripe.",
};

function PricingPlansFallback() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index} className="overflow-hidden pt-0">
          <Skeleton className="h-1.5 w-full rounded-none" />
          <CardContent className="space-y-4 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-52 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-28" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const steps = [
  {
    icon: MousePointerClick,
    title: "Choose your plan",
    description:
      "Pick Student Pro for unlimited bookmarks and priority booking, or Tutor Pro for unlimited tuition posts.",
  },
  {
    icon: CreditCard,
    title: "Pay securely with Stripe",
    description:
      "Checkout is hosted by Stripe. Both upgrades are one-time payments with no monthly renewal.",
  },
  {
    icon: BadgeCheck,
    title: "Pro activates automatically",
    description:
      "Stripe confirms the payment through the existing webhook and your account is upgraded to Pro.",
  },
];

export default async function PricingPage() {
  // The plan buttons depend on the visitor's session, so keep this route
  // request-time instead of prerendering a signed-out shell.
  await connection();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-3xl text-center">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          MentorLagbe Pro
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Upgrade once. Keep the benefits.
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Start free and upgrade only when you need more. Student Pro is $10 and
          Tutor Pro is $15 — both one-time payments, not subscriptions.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5 text-primary" />
            Instant activation
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" />
            Secure Stripe checkout
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="size-3.5 text-primary" />
            No monthly renewal
          </span>
        </div>
      </header>

      <section className="mt-12" aria-labelledby="pricing-plans-heading">
        <div className="text-center">
          <h2
            id="pricing-plans-heading"
            className="text-2xl font-bold tracking-tight"
          >
            Free vs Pro
          </h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
            Every Pro plan keeps the free tools you already use. Upgrade to
            remove the limits and unlock Pro visibility.
          </p>
        </div>

        <Suspense fallback={<PricingPlansFallback />}>
          <PricingPlans />
        </Suspense>
      </section>

      <section className="mx-auto mt-12 max-w-5xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            How upgrading works
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Three steps, one payment.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="rounded-xl border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your plan is updated only after Stripe confirms a successful payment.
          Free plans stay free forever.
        </p>
      </section>
    </div>
  );
}
