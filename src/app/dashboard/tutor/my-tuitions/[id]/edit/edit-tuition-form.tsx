"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getTuitionById, type Tuition } from "@/lib/action";
import { updateTuition } from "@/lib/mutation";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "English", "ICT"];
const CLASS_LEVELS = ["SSC", "HSC", "Class 8", "University"];

const approvalStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function EditTuitionForm({ id }: { id: string }) {
  const router = useRouter();

  const [tuition, setTuition] = useState<Tuition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [descCount, setDescCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadTuition = async () => {
      try {
        const data = await getTuitionById(id);
        if (!cancelled) {
          setTuition(data);
          setDescCount(data.description?.length ?? 0);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load this tuition."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadTuition();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || isSubmitting) return;

    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "").trim();
    const subject = String(data.get("subject") || "").trim();
    const classLevel = String(data.get("classLevel") || "").trim();
    const mode = data.get("mode") === "Offline" ? "Offline" : "Online";
    const monthlyFee = Number(data.get("monthlyFee") || 0);
    const daysPerWeek = Number(data.get("daysPerWeek") || 3);
    const description = String(data.get("description") || "").trim();

    if (!title || !subject || !classLevel || monthlyFee <= 0) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (description.length < 20) {
      toast.error("Description must be at least 20 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateTuition(
        id,
        { title, subject, classLevel, mode, monthlyFee, daysPerWeek, description },
        bannerFile
      );

      toast.success("Tuition updated successfully.");
      router.push(`/dashboard/tutor/my-tuitions/${id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update tuition."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 rounded-xl border bg-white p-6">
          <div className="h-7 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-full animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !tuition) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/tutor/my-tuitions"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Tuitions
        </Link>

        <div className="mt-4 rounded-xl border bg-white p-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle className="h-5 w-5" />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-slate-900">
            Could not load this tuition
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {loadError ?? "Tuition not found."}
          </p>
          <Link
            href="/dashboard/tutor/my-tuitions"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  const subjects = SUBJECTS.includes(tuition.subject)
    ? SUBJECTS
    : [tuition.subject, ...SUBJECTS];
  const classLevels = CLASS_LEVELS.includes(tuition.classLevel)
    ? CLASS_LEVELS
    : [tuition.classLevel, ...CLASS_LEVELS];
  const status = tuition.approvalStatus || "pending";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/dashboard/tutor/my-tuitions/${tuition.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to details
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Edit Tuition</h1>
          <p className="mt-1 text-xs text-slate-500">
            Update the details below. The approval status is not changed by
            editing.
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${
            approvalStyles[status] ?? "bg-slate-50 text-slate-700 ring-slate-200"
          }`}
        >
          {status}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-5 rounded-xl border bg-white p-6"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium">
            Tuition Title <span className="text-rose-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            defaultValue={tuition.title}
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
              defaultValue={tuition.subject}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Class Level <span className="text-rose-500">*</span>
            </label>
            <select
              name="classLevel"
              defaultValue={tuition.classLevel}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              {classLevels.map((classLevel) => (
                <option key={classLevel} value={classLevel}>
                  {classLevel}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium">
            Tuition Mode <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="Online"
                defaultChecked={tuition.mode !== "Offline"}
              />
              <span>Online (Zoom / Meet)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="Offline"
                defaultChecked={tuition.mode === "Offline"}
              />
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
              defaultValue={tuition.monthlyFee}
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
              defaultValue={String(tuition.daysPerWeek ?? 3)}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              {[2, 3, 4, 5, 6].map((day) => (
                <option key={day} value={day}>
                  {day} days / week
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">
            Banner Image
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-xs font-medium hover:bg-slate-50">
            <span>↑ Upload New Image (ImgBB)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setBannerFile(event.target.files?.[0] || null)
              }
              className="hidden"
            />
          </label>
          {bannerFile ? (
            <span className="ml-3 text-xs text-slate-500">
              {bannerFile.name}
            </span>
          ) : tuition.bannerImage ? (
            <span className="ml-3 text-xs text-slate-500">
              Current banner will be kept unless you upload a new one.
            </span>
          ) : null}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium">
              Tuition Description <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {descCount}/min 20 chars
            </span>
          </div>
          <textarea
            name="description"
            rows={4}
            required
            defaultValue={tuition.description}
            onChange={(event) => setDescCount(event.target.value.length)}
            placeholder="Describe what students will learn, your teaching methodology, prerequisites, and expected outcomes..."
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Link
            href={`/dashboard/tutor/my-tuitions/${tuition.id}`}
            className="rounded-lg border bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
