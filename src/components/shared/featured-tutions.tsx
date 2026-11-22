import Link from "next/link";
import { BookOpen, GraduationCap, Laptop, MapPin, UserCheck, ArrowRight } from "lucide-react";
import { getAllTuitions } from "@/lib/action";

interface TuitionItem {
  _id?: string;
  id?: string;
  title: string;
  subject: string;
  classLevel: string;
  mode?: "Online" | "Offline" | string;
  tuitionMode?: string;
  monthlyFee?: number;
  salary?: number;
  tutorName?: string;
  bannerImage?: string;
  approvalStatus?: string;
  status?: string;
  isActive?: boolean;
}

export default async function FeaturedTuitionsSection() {
  let featuredTuitions: TuitionItem[] = [];

  try {
    const data = await getAllTuitions();
    const list: TuitionItem[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.tuitions)
      ? data.tuitions
      : Array.isArray(data?.data)
      ? data.data
      : [];

    featuredTuitions = list
      .filter((item) => {
        const active = item.isActive === true;
        const approved =
          !item.approvalStatus || item.approvalStatus.toLowerCase() === "approved";
        return active && approved;
      })
      .slice(-6)
      .reverse()
      .slice(0, 6);
  } catch {
    featuredTuitions = [];
  }

  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Featured Listings
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Featured Tuitions &amp; Batches
            </h2>
          </div>

          <Link
            href="/tuitions"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <span>View All Tuitions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredTuitions.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No active tuitions available right now.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTuitions.map((tuition, idx) => {
              const id = tuition._id || tuition.id || String(idx);
              const mode = tuition.mode || tuition.tuitionMode || "Online";
              const fee = tuition.monthlyFee ?? tuition.salary ?? 0;

              return (
                <div
                  key={id}
                  className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="space-y-4">
                    <div className="h-44 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      <img
                        src={
                          tuition.bannerImage ||
                          "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80"
                        }
                        alt={tuition.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        <BookOpen className="h-3.5 w-3.5" />
                        {tuition.subject}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {mode}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-lg font-semibold text-slate-900 dark:text-white">
                      {tuition.title}
                    </h3>

                    <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>Class: {tuition.classLevel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">
                          Tutor: {tuition.tutorName || "Verified Tutor"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {mode.toLowerCase() === "online" ? (
                          <Laptop className="h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                        <span>{mode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        Monthly Fee
                      </span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {fee}
                      </span>
                    </div>

                    <Link
                      href={`/tuitions/${id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}