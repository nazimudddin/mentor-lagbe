"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TuitionFilterValues = {
  q: string;
  subject: string;
  classLevel: string;
  mode: string;
  minFee: string;
  maxFee: string;
};

type TuitionFiltersProps = {
  initialValues: TuitionFilterValues;
  subjects: string[];
  classLevels: string[];
};

const BROWSE_PATH = "/dashboard/student/browse-tuitions";

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function TuitionFilters({
  initialValues,
  subjects,
  classLevels,
}: TuitionFiltersProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [isPending, startTransition] = useTransition();

  const activeFilterCount = [
    values.q,
    values.subject,
    values.classLevel,
    values.mode,
    values.minFee,
    values.maxFee,
  ].filter((value) => value.trim().length > 0).length;

  const updateValue = (key: keyof TuitionFilterValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    const title = values.q.trim();

    if (title) params.set("q", title);
    if (values.subject) params.set("subject", values.subject);
    if (values.classLevel) params.set("classLevel", values.classLevel);
    if (values.mode) params.set("mode", values.mode);
    if (values.minFee.trim()) params.set("minFee", values.minFee.trim());
    if (values.maxFee.trim()) params.set("maxFee", values.maxFee.trim());

    const query = params.toString();

    startTransition(() => {
      router.push(`${BROWSE_PATH}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  const clearFilters = () => {
    setValues({
      q: "",
      subject: "",
      classLevel: "",
      mode: "",
      minFee: "",
      maxFee: "",
    });

    startTransition(() => {
      router.push(BROWSE_PATH, { scroll: false });
    });
  };

  return (
    <Card className="h-fit lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          Search &amp; Filters
        </CardTitle>
        <CardDescription>
          Search by title and narrow results by subject, class, mode, or fee.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tuition-search">Tuition title</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="tuition-search"
                value={values.q}
                onChange={(event) => updateValue("q", event.target.value)}
                placeholder="Search by title..."
                className="h-9 pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tuition-subject">Subject</Label>
            <select
              id="tuition-subject"
              value={values.subject}
              onChange={(event) =>
                updateValue("subject", event.target.value)
              }
              className={selectClassName}
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tuition-class-level">Class level</Label>
            <select
              id="tuition-class-level"
              value={values.classLevel}
              onChange={(event) =>
                updateValue("classLevel", event.target.value)
              }
              className={selectClassName}
            >
              <option value="">All class levels</option>
              {classLevels.map((classLevel) => (
                <option key={classLevel} value={classLevel}>
                  {classLevel}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tuition-mode">Tuition mode</Label>
            <select
              id="tuition-mode"
              value={values.mode}
              onChange={(event) => updateValue("mode", event.target.value)}
              className={selectClassName}
            >
              <option value="">All modes</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Monthly fee range (৳)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                aria-label="Minimum monthly fee"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Min"
                value={values.minFee}
                onChange={(event) =>
                  updateValue("minFee", event.target.value)
                }
                className="h-9"
              />
              <Input
                aria-label="Maximum monthly fee"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Max"
                value={values.maxFee}
                onChange={(event) =>
                  updateValue("maxFee", event.target.value)
                }
                className="h-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Search />
              )}
              {isPending ? "Applying..." : "Apply Filters"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={isPending || activeFilterCount === 0}
              className="w-full"
            >
              <X />
              Clear all
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
