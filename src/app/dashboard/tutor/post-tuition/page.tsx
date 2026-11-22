"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Crown,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import { getTutorPlan, verifyProPayment, type TutorPlan } from "@/lib/action";
import { createProCheckout, postTuition } from "@/lib/mutation";
import { cn } from "@/lib/utils";

function PlanCard({
  isPro,
  isLoading,
  onUpgrade,
}: {
  isPro: boolean;
  isLoading: boolean;
  onUpgrade: () => void;
}) {
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      <div className="flex flex-col rounded-xl border bg-white p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Zap className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Free</h2>
            <p className="text-xs text-slate-500">For getting started</p>
          </div>
        </div>

        <p className="mt-4 text-2xl font-bold text-slate-900">
          $0
          <span className="ml-1 text-xs font-normal text-slate-500">
            forever
          </span>
        </p>

        <ul className="mt-4 space-y-2 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Up to 2 tuition posts
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Manage applicants
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Basic support
          </li>
        </ul>

        <button
          type="button"
          disabled
          className="mt-6 w-full cursor-not-allowed rounded-lg border bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500"
        >
          {isPro ? "Free plan" : "Current Plan"}
        </button>
      </div>

      <div className="relative flex flex-col rounded-xl border-2 border-indigo-500 bg-white p-6 shadow-sm">
        <span className="absolute -top-3 right-5 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          Best value
        </span>

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Crown className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Pro</h2>
            <p className="text-xs text-slate-500">For growing tutors</p>
          </div>
        </div>

        <p className="mt-4 text-2xl font-bold text-slate-900">
          $15
          <span className="ml-1 text-xs font-normal text-slate-500">
            one-time
          </span>
        </p>

        <ul className="mt-4 space-y-2 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Unlimited tuition posts
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Manage applicants
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Priority support
          </li>
        </ul>

        <button
          type="button"
          onClick={onUpgrade}
          disabled={isLoading || isPro}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crown className="h-4 w-4" />
          )}
          {isLoading ? "Redirecting…" : isPro ? "Current Plan" : "Upgrade to Pro"}
        </button>
      </div>
    </div>
  );
}

function PostTuitionContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const checkoutSessionId = searchParams.get("session_id");

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [descCount, setDescCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [planInfo, setPlanInfo] = useState<TutorPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const cancelledNoticeRef = useRef(false);
  const verifiedSessionRef = useRef<string | null>(null);

  const loadPlan = useCallback(async () => {
    setIsPlanLoading(true);
    setPlanError(null);

    try {
      const data = await getTutorPlan();
      setPlanInfo(data);
    } catch (error) {
      setPlanError(
        error instanceof Error
          ? error.message
          : "Failed to load your plan details."
      );
    } finally {
      setIsPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitialPlan = async () => {
      try {
        const data = await getTutorPlan();
        if (!cancelled) {
          setPlanInfo(data);
          setPlanError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPlanError(
            error instanceof Error
              ? error.message
              : "Failed to load your plan details."
          );
        }
      } finally {
        if (!cancelled) setIsPlanLoading(false);
      }
    };

    void loadInitialPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle the return trip from Stripe Checkout. The plan is only treated as
  // upgraded after the backend verifies the session with Stripe.
  useEffect(() => {
    if (paymentStatus === "cancelled") {
      if (!cancelledNoticeRef.current) {
        cancelledNoticeRef.current = true;
        toast.info("Payment cancelled. You are still on the Free plan.");
      }
      router.replace("/dashboard/tutor/post-tuition");
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
      try {
        await verifyProPayment(checkoutSessionId);
        if (cancelled) return;

        verifiedSessionRef.current = checkoutSessionId;
        toast.success(
          "Welcome to Pro! You can now post unlimited tuitions."
        );
        await loadPlan();
        router.replace("/dashboard/tutor/post-tuition");
      } catch (error) {
        if (cancelled) return;

        toast.error(
          error instanceof Error
            ? error.message
            : "We could not verify your payment. Please try again."
        );
      }
    };

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [paymentStatus, checkoutSessionId, router, loadPlan]);

  const handleUpgrade = async () => {
    if (isUpgrading) return;

    setIsUpgrading(true);

    try {
      const { url } = await createProCheckout();
      if (!url) throw new Error("Stripe did not return a checkout URL.");
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout."
      );
      setIsUpgrading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!planInfo?.canPost) {
      toast.error(
        "You have reached the Free plan limit. Upgrade to Pro to post more tuitions."
      );
      return;
    }

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const title = String(data.title || "").trim();
    const subject = String(data.subject || "").trim();
    const classLevel = String(data.classLevel || "").trim();
    const mode = data.mode === "Offline" ? "Offline" : "Online";
    const monthlyFee = Number(data.monthlyFee || 0);
    const daysPerWeek = Number(data.daysPerWeek || 3);
    const description = String(data.description || "").trim();

    if (
      !title ||
      !subject ||
      !classLevel ||
      monthlyFee <= 0 ||
      description.length < 50
    ) {
      toast.error("Please fill all required fields (description min 50 chars).");
      return;
    }

    setIsSubmitting(true);

    try {
      await postTuition(
        {
          title,
          subject,
          classLevel,
          mode,
          monthlyFee,
          daysPerWeek,
          description,
          tutorName: session?.user?.name || "",
          tutorEmail: session?.user?.email || "",
          approvalStatus: "pending",
          isActive: true,
        },
        bannerFile
      );

      toast.success("Tuition submitted for approval!");
      form.reset();
      setBannerFile(null);
      setDescCount(0);
      await loadPlan();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to post tuition."
      );
      // A stale plan can be the cause of a rejected post, so refresh it.
      await loadPlan();
    } finally {
      setIsSubmitting(false);
    }
  };

  const showPlanCards = Boolean(
    planInfo && !planInfo.isPro && !planInfo.canPost
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Post a New Tuition</h1>
        <p className="mt-1 text-xs text-slate-500">
          Fill in details about the subject, class level, mode, and fees.
          Tuitions will be reviewed by admin prior to publication.
        </p>

        {!isPlanLoading && planInfo ? (
          <div
            className={cn(
              "mt-4 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs",
              planInfo.isPro
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            )}
          >
            {planInfo.isPro ? (
              <Crown className="h-4 w-4" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {planInfo.isPro ? (
              <span>
                <span className="font-semibold">Pro plan</span> — unlimited
                tuition posts.
              </span>
            ) : planInfo.tuitionCount >= (planInfo.limit ?? 0) ? (
              <span>
                <span className="font-semibold">Free plan</span> — the limit of{" "}
                {planInfo.limit} tuition posts has been reached.
              </span>
            ) : (
              <span>
                <span className="font-semibold">Free plan</span> —{" "}
                {planInfo.tuitionCount} of {planInfo.limit} tuition posts used.
              </span>
            )}
          </div>
        ) : null}
      </div>

      {isPlanLoading ? (
        <div className="rounded-xl border bg-white p-6">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-full animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        </div>
      ) : planError ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-slate-900">
            Could not load your plan
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {planError}
          </p>
          <button
            type="button"
            onClick={() => void loadPlan()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : showPlanCards ? (
        <>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <AlertCircle className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  You have reached the Free plan limit
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Free tutors can post up to 2 tuitions. Upgrade to Pro to post
                  unlimited tuitions and keep growing.
                </p>
              </div>
            </div>
          </div>

          <PlanCard
            isPro={false}
            isLoading={isUpgrading}
            onUpgrade={() => void handleUpgrade()}
          />

          <p className="mt-4 text-center text-xs text-slate-500">
            Payments are securely processed by Stripe. Your plan is upgraded
            only after Stripe confirms a successful payment.
          </p>
        </>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border bg-white p-6"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Tuition Title <span className="text-rose-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g., Master HSC Higher Mathematics & Calculus"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                name="subject"
                defaultValue="Mathematics"
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="English">English</option>
                <option value="ICT">ICT</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Class Level <span className="text-rose-500">*</span>
              </label>
              <select
                name="classLevel"
                defaultValue="SSC"
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="SSC">SSC</option>
                <option value="HSC">HSC</option>
                <option value="Class 8">Class 8</option>
                <option value="University">University</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium">
              Tuition Mode <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="mode" value="Online" defaultChecked />
                <span>Online (Zoom / Meet)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="mode" value="Offline" />
                <span>Offline (In-Person / Home Visit)</span>
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Monthly Fee ($ USD) <span className="text-rose-500">*</span>
              </label>
              <input
                name="monthlyFee"
                type="number"
                min={1}
                required
                placeholder="e.g., 150"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Days Per Week <span className="text-rose-500">*</span>
              </label>
              <select
                name="daysPerWeek"
                defaultValue="3"
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="2">2 days / week</option>
                <option value="3">3 days / week</option>
                <option value="4">4 days / week</option>
                <option value="5">5 days / week</option>
                <option value="6">6 days / week</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Banner Image
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-xs font-medium hover:bg-slate-50">
              <span>↑ Upload Image (ImgBB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {bannerFile && (
              <span className="ml-3 text-xs text-slate-500">
                {bannerFile.name}
              </span>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium">
                Tuition Description <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {descCount}/min 50 chars
              </span>
            </div>
            <textarea
              name="description"
              rows={4}
              required
              onChange={(e) => setDescCount(e.target.value.length)}
              placeholder="Describe what students will learn, your teaching methodology, prerequisites, and expected outcomes..."
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Link
              href="/dashboard/tutor/my-tuitions"
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              View my tuitions
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !planInfo?.canPost}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Posting…" : "Publish Tuition"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PostTuitionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-64 w-full animate-pulse rounded-xl bg-slate-100" />
        </div>
      }
    >
      <PostTuitionContent />
    </Suspense>
  );
}
