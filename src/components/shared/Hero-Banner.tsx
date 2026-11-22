"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, CheckCircle2, Users, BookOpen, ShieldCheck, ArrowRight } from "lucide-react";

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (mode) params.set("mode", mode);
    const qs = params.toString();
    router.push(qs ? `/tuitions?${qs}` : "/tuitions");
  };

  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-indigo-50/70 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Tutors &amp; Structured Mentorship Batches</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.15] dark:text-white">
              Find Your Ideal Tutor or{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                Mentorship Batch
              </span>{" "}
              Today
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              Connect with admin-verified educators for 1-on-1 home tuition or interactive online batches across Mathematics, Science, Programming, and IELTS.
            </p>

            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-2.5 rounded-2xl border bg-white p-2.5 shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-1 items-center gap-2.5 px-3">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search subject or batch (e.g. HSC Physics, Math)..."
                  className="w-full bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                />
              </div>

              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Modes</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                <span>Find Tuitions</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/tuitions"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Browse All Tuitions
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Become a Tutor
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Admin-Approved Listings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Online &amp; Home Tuition</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Transparent Monthly Fees</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-indigo-100/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <div className="overflow-hidden rounded-2xl bg-indigo-50 dark:bg-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
                  alt="Students and mentor collaborating"
                  className="h-64 w-full object-cover sm:h-72"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">500+</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Verified Tutors</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">1,200+</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Active Enrollments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}