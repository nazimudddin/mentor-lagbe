"use client";

import { UserPlus, Search, Send, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    step: "01",
    title: "Create Your Account",
    description:
      "Sign up in seconds as a Student looking for guidance or a Tutor ready to share expertise and manage batches.",
    icon: UserPlus,
  },
  {
    step: "02",
    title: "Browse or Post Tuitions",
    description:
      "Students filter admin-verified tuitions by subject, class, and mode, while Tutors publish structured batches.",
    icon: Search,
  },
  {
    step: "03",
    title: "Apply & Review Matches",
    description:
      "Students apply with their preferred schedule and learning goals. Tutors review applications directly from their dashboard.",
    icon: Send,
  },
  {
    step: "04",
    title: "Start Learning Seamlessly",
    description:
      "Once accepted, begin online or home sessions with clear monthly fees and real-time application tracking.",
    icon: CheckCircle2,
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-t border-slate-100 bg-slate-50/70 py-16 sm:py-20 dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Simple Workflow
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            How MentorLagbe Works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            Whether you are searching for the right mentor or managing your own tuition batches, getting started takes four simple steps.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-300 dark:text-slate-700">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 h-1 w-10 rounded-full bg-indigo-600/20" />
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/tuitions"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <span>Explore Available Tuitions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}